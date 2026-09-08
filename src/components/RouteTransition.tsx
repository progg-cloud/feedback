"use client";

import { usePathname } from "next/navigation";

/**
 * A quick fade whenever the route changes — keyed on pathname so the
 * wrapper remounts and the CSS animation replays. Kept short (~130ms) so
 * navigation feels instant. Respects prefers-reduced-motion (globals.css).
 */
export function RouteTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="anim-fade">
      {children}
    </div>
  );
}
