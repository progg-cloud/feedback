import Link from "next/link";

/** RohtreMedia wordmark. Replace with the real logo asset during the brand pass. */
export function Wordmark({ onDark = false }: { onDark?: boolean }) {
  return (
    <span
      className={`text-xl font-display tracking-tight ${
        onDark ? "text-white" : "text-ink-soft"
      }`}
    >
      Rohtre<span className="text-brand">Media</span>
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/">
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
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <Wordmark onDark />
        <p>
          Questions?{" "}
          <a
            href="mailto:hello@rohtremedia.com"
            className="text-white underline-offset-2 hover:underline"
          >
            hello@rohtremedia.com
          </a>
        </p>
      </div>
    </footer>
  );
}
