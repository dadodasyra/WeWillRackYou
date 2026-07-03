"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";

const linkClass = (active: boolean) =>
  `flex flex-1 flex-col items-center gap-1 px-2 py-2 text-xs ${
    active ? "text-emerald-700 font-semibold" : "text-stone-600"
  }`;

function useVisualViewportBottomOffset() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const gap = window.innerHeight - viewport.height - viewport.offsetTop;
      setOffset(Math.max(0, Math.round(gap)));
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return offset;
}

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const bottomOffset = useVisualViewportBottomOffset();

  if (pathname === "/login") return null;

  return (
    <nav
      className="fixed left-0 right-0 z-50 border-t border-stone-200 bg-white/95 backdrop-blur safe-area-pb"
      style={{ bottom: bottomOffset }}
    >
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
