"use client";

import { useCallback, useEffect, useState } from "react";
import type { SerializedOwner } from "@/lib/validations";
import { Select } from "@/components/ui/Select";

const DEFAULT_OWNER_NAME = "EARL Beiner";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  onBlur?: () => void;
};

export function OwnerSelect({
  label,
  value,
  onChange,
  required,
  error,
  onBlur,
}: Props) {
  const [owners, setOwners] = useState<SerializedOwner[]>([]);

  const load = useCallback(async () => {
    const response = await fetch("/api/owners");
    if (response.ok) setOwners(await response.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const defaultOwnerId =
    owners.find((o) => o.name === DEFAULT_OWNER_NAME)?.id ?? owners[0]?.id ?? "";

  useEffect(() => {
    if (!defaultOwnerId || value) return;
    onChange(defaultOwnerId);
  }, [defaultOwnerId, value, onChange]);

  const options = owners.map((owner) => ({
    value: owner.id,
    label: owner.name,
  }));

  if (owners.length === 0) {
    return (
      <label className="block space-y-1">
        <span className="text-sm font-medium text-stone-700">
          {required ? `${label} *` : label}
        </span>
        <div className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-3 text-base text-stone-500">
          Chargement…
        </div>
      </label>
    );
  }

  return (
    <Select
      label={required ? `${label} *` : label}
      value={value || defaultOwnerId}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      error={error}
      options={options}
      required={required}
    />
  );
}
