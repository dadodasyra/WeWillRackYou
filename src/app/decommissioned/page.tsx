"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { DecommissionedListSection } from "@/components/entries/DecommissionedListSection";
import { VarietyLabel } from "@/components/entries/VarietyLabel";
import type { SerializedEntry } from "@/lib/validations";

type Filter = "all" | "paid" | "unpaid";
type CategoryTab = "kikiriki" | "oil" | "general";

const CATEGORY_TABS = [
  { id: "kikiriki" as const, label: "Ferme du kikiriki" },
  { id: "oil" as const, label: "Pressage d'huile" },
  { id: "general" as const, label: "Décommissionné" },
];

export default function DecommissionedPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<CategoryTab>("kikiriki");
  const [kikirikiEntries, setKikirikiEntries] = useState<SerializedEntry[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [kikirikiLoading, setKikirikiLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadKikiriki = useCallback(async () => {
    setKikirikiLoading(true);
    const response = await fetch(
      `/api/entries/decommissioned?reason=KIKIRIKI&filter=${filter}`,
    );
    if (response.ok) {
      setKikirikiEntries(await response.json());
    }
    setKikirikiLoading(false);
  }, [filter]);

  useEffect(() => {
    if (activeTab === "kikiriki") {
      loadKikiriki();
    }
  }, [activeTab, loadKikiriki]);

  async function togglePaid(entry: SerializedEntry) {
    if (!isAdmin) return;

    const response = await fetch(`/api/entries/${entry.id}/paid`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid: !entry.isPaid }),
    });
    if (response.ok) {
      loadKikiriki();
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-emerald-900">Décommissionnés</h1>
        <p className="text-sm text-stone-600">
          Entrées retirées de l&apos;entrepôt, par catégorie
        </p>
      </header>

      <nav className="flex gap-2">
        {CATEGORY_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-xl border px-2 py-2.5 text-center text-xs font-medium transition sm:text-sm ${
                active
                  ? "border-emerald-600 bg-emerald-700 text-white shadow-sm"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {message ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p>
      ) : null}

      {activeTab === "kikiriki" ? (
        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <header className="space-y-0.5">
            <h2 className="text-base font-semibold text-emerald-900">Ferme du kikiriki</h2>
            <p className="text-xs text-stone-500">Entrées à régler</p>
          </header>

          <div className="flex gap-2">
            {(
              [
                ["all", "Tous"],
                ["unpaid", "Non payés"],
                ["paid", "Payés"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`flex-1 rounded-xl py-2 text-xs font-medium ${
                  filter === value ? "bg-emerald-700 text-white" : "bg-stone-100 text-stone-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {kikirikiLoading ? (
            <p className="text-sm text-stone-500">Chargement...</p>
          ) : kikirikiEntries.length === 0 ? (
            <p className="rounded-xl bg-stone-50 p-3 text-sm text-stone-600">
              Aucune entrée Ferme du kikiriki.
            </p>
          ) : (
            <ul className="space-y-3">
              {kikirikiEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <Link href={`/entry/${entry.id}`} className="font-semibold text-emerald-800">
                        Entrée #{entry.id}
                      </Link>
                      <p className="text-sm text-stone-600">
                        {entry.kind === "BIG_BAG" ? (
                          <VarietyLabel variety={entry.bigBagVariety} />
                        ) : (
                          "Autre"
                        )}
                      </p>
                      <p className="text-xs text-stone-500">
                        Décommissionné le{" "}
                        {entry.decommissionedAt
                          ? new Date(entry.decommissionedAt).toLocaleString("fr-FR")
                          : "-"}
                      </p>
                    </div>
                    <label
                      className={`flex items-center gap-2 text-sm ${!isAdmin ? "opacity-70" : ""}`}
                      title={isAdmin ? undefined : "Réservé aux administrateurs"}
                    >
                      <input
                        type="checkbox"
                        checked={entry.isPaid}
                        disabled={!isAdmin}
                        onChange={() => togglePaid(entry)}
                      />
                      Payé
                    </label>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {activeTab === "oil" ? (
        <DecommissionedListSection
          reason="OIL_PRESSING"
          title="Pressage d'huile"
          emptyMessage="Aucune entrée pour pressage d'huile."
          isAdmin={isAdmin}
          onMessage={setMessage}
        />
      ) : null}

      {activeTab === "general" ? (
        <DecommissionedListSection
          reason="GENERAL"
          title="Décommissionné"
          subtitle="Archivage général"
          emptyMessage="Aucune entrée décommissionnée."
          isAdmin={isAdmin}
          onMessage={setMessage}
        />
      ) : null}
    </main>
  );
}
