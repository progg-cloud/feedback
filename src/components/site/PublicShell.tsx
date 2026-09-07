import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { RouteTransition } from "@/components/RouteTransition";

export function PublicShell({
  heroEyebrow = "Client feedback",
  heroTitle,
  heroSubtitle,
  children,
}: {
  heroEyebrow?: string;
  heroTitle: string;
  heroSubtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-line bg-ink text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(232,38,44,0.35), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-5 py-14 text-center sm:py-20">
          <p className="eyebrow">{heroEyebrow}</p>
          <h1 className="mt-3 text-[2rem] font-display tracking-tight sm:text-[2.75rem] sm:leading-[1.15]">
            {heroTitle}
          </h1>
          <span className="rule rule-center mt-4" />
          {heroSubtitle ? (
            <p className="mx-auto mt-4 max-w-xl text-muted">{heroSubtitle}</p>
          ) : null}
        </div>
      </section>
      <main className="flex-1 bg-mist">
        <div className="mx-auto max-w-3xl px-5 py-10">
          <RouteTransition>{children}</RouteTransition>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
