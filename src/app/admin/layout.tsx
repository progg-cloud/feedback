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
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Wordmark />
            </Link>
            <span className="hidden text-xs font-semibold uppercase tracking-widest text-muted sm:inline">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{user.email}</span>
            <form action="/auth/sign-out" method="post">
              <button
                type="submit"
                className="focusable rounded-full border border-line px-3 py-1.5 font-semibold text-ink-soft hover:border-ink-soft"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-5 py-6">
        <AdminNav />
        <main className="min-w-0 flex-1">
          <RouteTransition>{children}</RouteTransition>
        </main>
      </div>
    </div>
  );
}
