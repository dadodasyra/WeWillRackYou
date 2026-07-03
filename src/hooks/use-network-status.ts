"use client";

import { useEffect, useState } from "react";

export function useNetworkStatus() {
  // Default to online so SSR and the first client render match (navigator is unavailable on the server).
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    function syncOnlineStatus() {
      setIsOnline(navigator.onLine);
    }

    syncOnlineStatus();
    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);

    return () => {
      window.removeEventListener("online", syncOnlineStatus);
      window.removeEventListener("offline", syncOnlineStatus);
    };
  }, []);

  return { isOnline, isOffline: !isOnline };
}
