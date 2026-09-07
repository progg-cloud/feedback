"use client";

import { usePathname } from "next/navigation";

/**
 * Replays a subtle rise-in animation whenever the route changes.
 * Keyed on pathname so React remounts the wrapper and the CSS
 * animation runs again. Respects prefers-reduced-motion (see globals.css).
 */
export function RouteTransition({
  children,
  variant = "rise",
}: {
  children: React.ReactNode;
  variant?: "rise" | "fade";
}) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={variant === "fade" ? "anim-fade" : "anim-rise"}>
      {children}
    </div>
  );
}
