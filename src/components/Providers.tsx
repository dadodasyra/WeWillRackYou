"use client";

import { SessionProvider } from "next-auth/react";
import { BottomNav } from "@/components/ui/BottomNav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-full flex-1 pb-20">{children}</div>
      <BottomNav />
    </SessionProvider>
  );
}
