"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const linkClass = (active: boolean) =>
  `flex flex-1 flex-col items-center gap-1 px-2 py-2 text-xs ${
    active ? "text-emerald-700 font-semibold" : "text-stone-600"
  }`;

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  if (pathname === "/login") return null;

  return (
    <nav className="z-50 w-full shrink-0 border-t border-stone-200 bg-white/95 backdrop-blur safe-area-pb">
      <div className="mx-auto flex max-w-lg items-stretch">
        <Link href="/" className={linkClass(pathname === "/")}>
          <span aria-hidden>🗺️</span>
          Carte
        </Link>
        <Link href="/decommissioned" className={linkClass(pathname === "/decommissioned")}>
          <span aria-hidden>📦</span>
          Sorties
        </Link>
        {isAdmin && (
          <Link
            href="/admin/users"
            className={linkClass(pathname.startsWith("/admin"))}
          >
            <span aria-hidden>⚙️</span>
            Admin
          </Link>
        )}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={linkClass(false)}
        >
          <span aria-hidden>🚪</span>
          Se déconnecter
        </button>
      </div>
    </nav>
  );
}
