"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { BottomNav } from "@/components/ui/BottomNav";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <div className="pb-bottom-nav">{children}</div>
      <BottomNav />
    </SessionProvider>
  );
}
