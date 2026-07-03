"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { DecommissionedListSection } from "@/components/entries/DecommissionedListSection";

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
  const [message, setMessage] = useState("");

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
        <DecommissionedListSection
          reason="KIKIRIKI"
          title="Ferme du kikiriki"
          subtitle="Entrées à régler"
          emptyMessage="Aucune entrée Ferme du kikiriki."
          isAdmin={isAdmin}
          onMessage={setMessage}
          showPaidControls
          allowClearAll={false}
        />
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
