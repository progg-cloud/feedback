export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-hidden>
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-white/10" />
        <div className="h-8 w-48 rounded bg-white/10" />
        <div className="h-1 w-9 rounded bg-white/10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 rounded-xl border border-line bg-paper"
          />
        ))}
      </div>
      <div className="h-64 rounded-xl border border-line bg-paper" />
      <div className="h-48 rounded-xl border border-line bg-paper" />
    </div>
  );
}
