"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SlotSelection } from "@/components/warehouse/WarehouseScene";
import { useNetworkStatus } from "@/hooks/use-network-status";
import {
  buildOccupiedMap,
  reconcileSelectedEntryId,
  reconcileSelectedSlot,
} from "@/lib/reconcile-home-selection";
import type { SerializedEntry } from "@/lib/validations";

const POLL_INTERVAL_MS = 15_000;
const FOCUS_SYNC_COOLDOWN_MS = 5_000;
const ENTRIES_STATUS = "ACTIVE";

type HomeDataSyncState = {
  decommissionEntry: SerializedEntry | null;
  selectedSlot: SlotSelection | null;
  selectedEntryId: number | null;
};

type HomeDataSyncActions = {
  setEntries: (entries: SerializedEntry[]) => void;
  setVarietyNames: (names: Record<string, string>) => void;
  setSelectedSlot: (slot: SlotSelection | null) => void;
  setSelectedEntryId: (id: number | null) => void;
};

type UseHomeDataSyncOptions = HomeDataSyncState & HomeDataSyncActions;

async function fetchFingerprint(): Promise<string | null> {
  const response = await fetch(`/api/entries/fingerprint?status=${ENTRIES_STATUS}`);
  if (!response.ok) return null;
  const data = (await response.json()) as { fingerprint: string };
  return data.fingerprint;
}

async function fetchHomeData(): Promise<{
  entries: SerializedEntry[] | null;
  varietyNames: Record<string, string> | null;
  fingerprint: string | null;
}> {
  const [entriesResponse, varietiesResponse, fingerprint] = await Promise.all([
    fetch(`/api/entries?status=${ENTRIES_STATUS}`),
    fetch("/api/big-bag-varieties"),
    fetchFingerprint(),
  ]);

  const entries = entriesResponse.ok
    ? ((await entriesResponse.json()) as SerializedEntry[])
    : null;

  let varietyNames: Record<string, string> | null = null;
  if (varietiesResponse.ok) {
    const varieties = (await varietiesResponse.json()) as { id: string; name: string }[];
    varietyNames = Object.fromEntries(varieties.map((v) => [v.id, v.name]));
  }

  return { entries, varietyNames, fingerprint };
}

export function useHomeDataSync({
  decommissionEntry,
  selectedSlot,
  selectedEntryId,
  setEntries,
  setVarietyNames,
  setSelectedSlot,
  setSelectedEntryId,
}: UseHomeDataSyncOptions) {
  const { isOnline } = useNetworkStatus();
  const lastFingerprintRef = useRef<string | null>(null);
  const lastFingerprintCheckAtRef = useRef(0);
  const wasOnlineRef = useRef(isOnline);
  const syncStateRef = useRef({ decommissionEntry, selectedSlot, selectedEntryId });
  const actionsRef = useRef({
    setEntries,
    setVarietyNames,
    setSelectedSlot,
    setSelectedEntryId,
  });

  useEffect(() => {
    syncStateRef.current = { decommissionEntry, selectedSlot, selectedEntryId };
  }, [decommissionEntry, selectedSlot, selectedEntryId]);

  useEffect(() => {
    actionsRef.current = {
      setEntries,
      setVarietyNames,
      setSelectedSlot,
      setSelectedEntryId,
    };
  }, [setEntries, setVarietyNames, setSelectedSlot, setSelectedEntryId]);

  const applyFetchedData = useCallback(
    (entries: SerializedEntry[], varietyNames: Record<string, string> | null) => {
      const occupiedMap = buildOccupiedMap(entries);
      const state = syncStateRef.current;
      const actions = actionsRef.current;

      actions.setEntries(entries);
      if (varietyNames) {
        actions.setVarietyNames(varietyNames);
      }
      actions.setSelectedSlot(reconcileSelectedSlot(state.selectedSlot, entries, occupiedMap));
      actions.setSelectedEntryId(reconcileSelectedEntryId(state.selectedEntryId, entries));
    },
    [],
  );

  const markFingerprintChecked = useCallback(() => {
    lastFingerprintCheckAtRef.current = Date.now();
  }, []);

  const refresh = useCallback(async () => {
    const data = await fetchHomeData();
    if (!data.entries) return;

    applyFetchedData(data.entries, data.varietyNames);
    if (data.fingerprint) {
      lastFingerprintRef.current = data.fingerprint;
    }
    markFingerprintChecked();
  }, [applyFetchedData, markFingerprintChecked]);

  const canSync = useCallback(() => {
    if (!navigator.onLine) return false;
    if (syncStateRef.current.decommissionEntry) return false;
    return true;
  }, []);

  const checkAndSync = useCallback(
    async (options?: { bypassCooldown?: boolean }) => {
      if (!canSync()) return;

      if (
        !options?.bypassCooldown &&
        Date.now() - lastFingerprintCheckAtRef.current < FOCUS_SYNC_COOLDOWN_MS
      ) {
        return;
      }

      markFingerprintChecked();

      const fingerprint = await fetchFingerprint();
      if (!fingerprint) return;

      if (lastFingerprintRef.current === null) {
        lastFingerprintRef.current = fingerprint;
        return;
      }

      if (fingerprint === lastFingerprintRef.current) return;

      const data = await fetchHomeData();
      if (!data.entries) return;

      applyFetchedData(data.entries, data.varietyNames);
      if (data.fingerprint) {
        lastFingerprintRef.current = data.fingerprint;
      } else {
        lastFingerprintRef.current = fingerprint;
      }
    },
    [applyFetchedData, canSync, markFingerprintChecked],
  );

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      const data = await fetchHomeData();
      if (cancelled || !data.entries) return;

      applyFetchedData(data.entries, data.varietyNames);
      if (data.fingerprint) {
        lastFingerprintRef.current = data.fingerprint;
      }
      markFingerprintChecked();
    }

    void initialLoad();

    return () => {
      cancelled = true;
    };
  }, [applyFetchedData, markFingerprintChecked]);

  useEffect(() => {
    if (!isOnline) return;

    function handleVisible() {
      if (document.visibilityState === "visible") {
        void checkAndSync();
      }
    }

    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [checkAndSync, isOnline]);

  useEffect(() => {
    if (!isOnline) return;

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      void checkAndSync({ bypassCooldown: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [checkAndSync, isOnline]);

  useEffect(() => {
    if (!isOnline) {
      wasOnlineRef.current = false;
      return;
    }

    if (wasOnlineRef.current) return;
    wasOnlineRef.current = true;
    void checkAndSync({ bypassCooldown: true });
  }, [checkAndSync, isOnline]);

  return { refresh };
}
