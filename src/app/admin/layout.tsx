import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { Wordmark } from "@/components/site/SiteChrome";
import { AdminNav } from "@/components/admin/AdminNav";
import { RouteTransition } from "@/components/RouteTransition";

export const metadata = { title: "Admin — RohtreMedia Feedback" };

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-mist">
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Wordmark />
            <span className="hidden text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted sm:inline">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{admin.email}</span>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="focusable rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-soft transition-colors hover:border-ink-soft hover:bg-white/[0.04]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        <AdminNav />
        <main className="min-w-0 flex-1">
          <RouteTransition>{children}</RouteTransition>
        </main>
      </div>
    </div>
  );
}
