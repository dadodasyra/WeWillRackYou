"use client";

import { SessionProvider } from "next-auth/react";
import { BottomNav } from "@/components/ui/BottomNav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto">{children}</div>
        <BottomNav />
      </div>
    </SessionProvider>
  );
}
