"use client";

import { usePathname } from "next/navigation";

/** Fade-in halus tiap pindah halaman (di-key oleh pathname agar animasi berulang). */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="route-fade">
      {children}
    </div>
  );
}
