"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";

const links = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/services/report", label: "Service report" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden w-44 shrink-0 sm:block">
      <ul className="space-y-1">
        {links.map((l) => {
          const active = l.exact
            ? pathname === l.href
            : pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                data-active={active}
                className={clsx(
                  "nav-link block rounded-lg px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-paper text-brand"
                    : "text-muted hover:bg-paper hover:text-ink-soft",
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
