"use client";

import { SessionProvider } from "next-auth/react";
import { BottomNav } from "@/components/ui/BottomNav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="pb-bottom-nav">{children}</div>
      <BottomNav />
    </SessionProvider>
  );
}
