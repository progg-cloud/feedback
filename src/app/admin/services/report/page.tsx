import Link from "next/link";
import { getServiceReport } from "@/server/reports";
import { formatPeriodMonth } from "@/lib/month";
import { Card, EyebrowHeading } from "@/components/ui/Card";
import { RatingBadge } from "@/components/ui/Badge";

export const metadata = { title: "Service report — Admin" };

export default async function ServiceReportPage() {
  const scores = await getServiceReport();

  return (
    <div className="space-y-6">
      <EyebrowHeading
        eyebrow="Report"
        title="Where we're weakest"
        subtitle="Average score per service across every client, worst first."
      />

      {scores.length === 0 ? (
        <Card className="text-center text-muted">
          No ratings yet. This fills in as clients submit feedback.
        </Card>
      ) : (
        <div className="space-y-4">
          {scores.map((s) => (
            <Card key={s.service_id}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-ink-soft">{s.service_name}</h3>
                  <p className="text-xs text-muted">
                    {s.responses} rating{s.responses === 1 ? "" : "s"}
                  </p>
                </div>
                <RatingBadge value={s.average} />
              </div>
              {s.lows.length > 0 ? (
                <ul className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
                  {s.lows.map((l, i) => (
                    <li key={i} className="text-muted">
                      <span className="font-semibold text-ink-soft">
                        {l.client_name}
                      </span>{" "}
                      · {formatPeriodMonth(l.period)} · rated {l.rating}
                      {l.comment ? (
                        <span className="block italic">“{l.comment}”</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted">
        <Link href="/admin" className="hover:text-brand">
          ← Back to overview
        </Link>
      </p>
    </div>
  );
}
