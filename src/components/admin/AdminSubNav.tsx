"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_TABS = [
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/varieties", label: "Variétés" },
  { href: "/admin/owners", label: "Propriétaires" },
  { href: "/admin/qr-print", label: "QR Codes" },
] as const;

export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg gap-2 px-4 py-3">
        {ADMIN_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition ${
                active
                  ? "border-emerald-600 bg-emerald-700 text-white shadow-sm"
                  : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
