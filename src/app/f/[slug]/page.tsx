import { notFound } from "next/navigation";
import { getPortalClient, getExistingFeedback } from "@/lib/portal";
import { currentPeriodMonth, periodToMonthInput } from "@/lib/month";
import { PublicShell } from "@/components/site/PublicShell";
import { Card } from "@/components/ui/Card";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = await getPortalClient(slug);
  return {
    title: client
      ? `Feedback for ${client.name} — RohtreMedia`
      : "Feedback — RohtreMedia",
  };
}

export default async function ClientFeedbackPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const client = await getPortalClient(slug);
  if (!client) notFound();

  const period = currentPeriodMonth();
  const monthInput = periodToMonthInput(period);
  const existing = await getExistingFeedback(client.id, period);

  return (
    <PublicShell
      heroTitle={`Feedback for ${client.name}`}
      heroSubtitle="Tell us how we're doing this month. It takes about two minutes."
    >
      {client.services.length === 0 ? (
        <Card className="text-center">
          <p className="eyebrow">Nothing to rate yet</p>
          <h2 className="mt-2 text-xl font-display text-ink-soft">
            We haven&rsquo;t set up your services here yet
          </h2>
          <span className="rule rule-center mt-3" />
          <p className="mt-4 text-muted">
            Hang tight — we&rsquo;ll let you know when this form is ready. If you
            think this is a mistake, just reply to the message we sent you.
          </p>
        </Card>
      ) : (
        <FeedbackForm
          client={client}
          existing={existing}
          monthInput={monthInput}
        />
      )}
    </PublicShell>
  );
}
