"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/services/report", label: "Service report" },
];

export function AdminNav() {
  const pathname = usePathname();

  // Exactly one active item: the nav link that is the longest matching
  // prefix of the current path. Prevents /admin/services AND
  // /admin/services/report both lighting up.
  const activeHref = links
    .filter(
      (l) => pathname === l.href || pathname.startsWith(l.href + "/"),
    )
    .reduce<string | null>(
      (best, l) =>
        best && best.length >= l.href.length ? best : l.href,
      null,
    );

  return (
    <nav className="hidden w-44 shrink-0 sm:block">
      <ul className="-mx-3 space-y-0.5">
        {links.map((l) => {
          const active = l.href === activeHref;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                data-active={active}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "nav-link block rounded-lg px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-white/[0.06] text-brand"
                    : "text-muted hover:bg-white/[0.035] hover:text-ink-soft",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
