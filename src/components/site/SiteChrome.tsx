import Image from "next/image";
import Link from "next/link";

/** RohtreMedia logo lockup — the R mark plus the wordmark. */
export function Wordmark({
  onDark = false,
  markOnly = false,
}: {
  onDark?: boolean;
  markOnly?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5 align-middle">
      <Image
        src="/rohtre-r.png"
        alt="RohtreMedia"
        width={119}
        height={124}
        priority
        unoptimized
        className="h-8 w-auto"
      />
      {markOnly ? null : (
        <span
          className={`text-lg font-display tracking-tight ${
            onDark ? "text-white" : "text-ink-soft"
          }`}
        >
          Rohtre<span className="text-brand">Media</span>
        </span>
      )}
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="flex h-16 w-full items-center justify-between px-5 sm:px-8">
        <Link href="/admin" aria-label="Admin panel">
          <Wordmark />
        </Link>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted">
          Client Feedback
        </span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-ink text-muted-dark">
      <div className="flex w-full flex-col gap-3 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Wordmark onDark />
        <p>
          Questions?{" "}
          <a
            href="mailto:sales@rohtremedia.com"
            className="text-white underline-offset-2 hover:underline"
          >
            sales@rohtremedia.com
          </a>
        </p>
      </div>
    </footer>
  );
}
