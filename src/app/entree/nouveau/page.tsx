"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { EntryForm } from "@/components/entries/EntryForm";
import type { SerializedEntry } from "@/lib/validations";

export default function NouvelleEntreePage() {
  const router = useRouter();

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-4">
      <header className="space-y-1">
        <Link href="/" className="text-sm text-emerald-700">
          ← Retour à la carte
        </Link>
        <h1 className="text-xl font-bold text-emerald-900">Nouvelle entrée</h1>
        <p className="text-sm text-stone-600">
          Saisissez l&apos;identifiant imprimé sur le sticker QR. Il ne doit pas encore exister dans le
          système.
        </p>
      </header>

      <EntryForm
        requireManualId
        onSaved={(entry: SerializedEntry) => {
          router.push(`/entree/${entry.id}`);
        }}
      />
    </main>
  );
}
