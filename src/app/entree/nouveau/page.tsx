"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EntryForm } from "@/components/entries/EntryForm";
import type { SerializedEntry } from "@/lib/validations";

export default function NouvelleEntreePage() {
  const router = useRouter();
  const [nextId, setNextId] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/entries/next-id")
      .then((r) => r.json())
      .then((data) => setNextId(data.nextId));
  }, []);

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <header className="space-y-1">
        <Link href="/" className="text-sm text-emerald-700">
          ← Retour à la carte
        </Link>
        <h1 className="text-xl font-bold text-emerald-900">
          Nouvelle entrée{nextId ? ` #${nextId}` : ""}
        </h1>
      </header>

      {nextId ? (
        <EntryForm
          onSaved={(entry: SerializedEntry) => {
            router.push(`/entree/${entry.id}`);
          }}
        />
      ) : (
        <p className="text-stone-500">Chargement...</p>
      )}
    </main>
  );
}
