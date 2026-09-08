import { getDashboardData } from "@/server/dashboard";
import { clientFeedbackUrl } from "@/lib/site-url";
import { formatPeriodMonth } from "@/lib/month";
import { Card, EyebrowHeading } from "@/components/ui/Card";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import { TrendChart } from "@/components/admin/TrendChart";
import { DownloadCsvButton } from "@/components/admin/DownloadCsvButton";

export const metadata = { title: "Overview — Admin" };

export default async function AdminOverviewPage() {
  const d = await getDashboardData();

  const csvRows = d.trend.map((t) => ({
    month: t.label,
    average_rating: t.average ?? "",
    submissions: t.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <EyebrowHeading
          eyebrow="Admin"
          title="Overview"
          subtitle={`Feedback for ${formatPeriodMonth(d.currentMonth)}`}
        />
        <DownloadCsvButton
          rows={csvRows}
          filename="overview-trend.csv"
          label="Download trend CSV"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Submissions this month" value={String(d.submissionsThisMonth)} />
        <Stat
          label="Overall average this month"
          value={d.overallAverage != null ? d.overallAverage.toFixed(2) : "—"}
        />
        <Stat
          label="Clients still pending"
          value={String(d.pendingClients.length)}
        />
      </div>

      <Card>
        <EyebrowHeading eyebrow="Trend" title="Average rating month over month" />
        <div className="mt-4">
          <TrendChart data={d.trend} />
        </div>
      </Card>

      <Card>
        <EyebrowHeading
          eyebrow="Chasing list"
          title="Not submitted this month"
        />
        <ul className="mt-4 divide-y divide-line">
          {d.pendingClients.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted">
              Everyone active has submitted this month. 🎉
            </li>
          ) : (
            d.pendingClients.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="font-medium text-ink-soft">{c.name}</span>
                <CopyLinkButton url={clientFeedbackUrl(c.slug)} />
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-3xl font-display text-ink-soft">{value}</p>
    </Card>
  );
}
