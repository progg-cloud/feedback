import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/server/queries";
import { getClientReport } from "@/server/reports";
import { formatPeriodMonth } from "@/lib/month";
import { ratingColor } from "@/lib/theme";
import { Card, EyebrowHeading } from "@/components/ui/Card";
import { TrendChart } from "@/components/admin/TrendChart";

export const metadata = { title: "Client report — Admin" };

export default async function ClientReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();
  const report = await getClientReport(id);

  const hasData = report.trend.length > 0;

  return (
    <div className="space-y-6">
      <EyebrowHeading
        eyebrow="Report"
        title={client.name}
        subtitle="Satisfaction over time, service by service."
      />
      <p className="text-sm text-muted">
        <Link href={`/admin/clients/${id}`} className="hover:text-brand">
          ← Back to {client.name}
        </Link>
      </p>

      {!hasData ? (
        <Card className="text-center text-muted">
          No feedback from {client.name} yet.
        </Card>
      ) : (
        <>
          <Card>
            <EyebrowHeading eyebrow="Trend" title="Average rating over time" />
            <div className="mt-4">
              <TrendChart data={report.trend} />
            </div>
          </Card>

          <Card className="overflow-x-auto">
            <EyebrowHeading eyebrow="Heatmap" title="Rating by service and month" />
            <table className="mt-4 w-full min-w-[520px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs uppercase text-muted">
                    Service
                  </th>
                  {report.heatmap.months.map((m) => (
                    <th
                      key={m.key}
                      className="p-2 text-center text-xs uppercase text-muted"
                    >
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.heatmap.services.map((svc) => (
                  <tr key={svc}>
                    <td className="p-2 font-medium text-ink-soft">{svc}</td>
                    {report.heatmap.months.map((m) => {
                      const v = report.heatmap.cells[svc]?.[m.key];
                      return (
                        <td key={m.key} className="p-1 text-center">
                          {v != null ? (
                            <span
                              className="inline-block min-w-[2rem] rounded px-2 py-1 font-bold text-white"
                              style={{ backgroundColor: ratingColor(v) }}
                            >
                              {v}
                            </span>
                          ) : (
                            <span className="text-muted-dark">·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card>
            <EyebrowHeading eyebrow="In their words" title="What they told us" />
            <ul className="mt-4 space-y-4">
              {report.narrative.length === 0 ? (
                <li className="text-sm text-muted">No written feedback yet.</li>
              ) : (
                report.narrative.map((n) => (
                  <li key={n.period} className="border-b border-line pb-4 last:border-0">
                    <p className="text-xs font-semibold uppercase text-muted">
                      {formatPeriodMonth(n.period)}
                    </p>
                    {n.what_went_wrong ? (
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">Didn&rsquo;t go well:</span>{" "}
                        {n.what_went_wrong}
                      </p>
                    ) : null}
                    {n.what_can_we_improve ? (
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">To improve:</span>{" "}
                        {n.what_can_we_improve}
                      </p>
                    ) : null}
                    {n.overall_comment ? (
                      <p className="mt-1 text-sm text-muted">
                        {n.overall_comment}
                      </p>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </Card>

          {report.serviceComments.length > 0 ? (
            <Card>
              <EyebrowHeading
                eyebrow="Per service"
                title="Service-level comments"
              />
              <ul className="mt-4 space-y-2 text-sm">
                {report.serviceComments.map((c, i) => (
                  <li key={i}>
                    <span className="font-semibold text-ink-soft">
                      {c.service}
                    </span>{" "}
                    <span className="text-xs text-muted">
                      {formatPeriodMonth(c.period)}
                    </span>
                    <span className="block italic text-muted">“{c.comment}”</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
