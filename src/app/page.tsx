import { createClient } from "@/lib/supabase/server";
import { PublicShell } from "@/components/site/PublicShell";
import { Card } from "@/components/ui/Card";
import { ClientPicker } from "@/components/feedback/ClientPicker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Client feedback — RohtreMedia" };

export default async function HomePage() {
  const supabase = await createClient();
  // RLS restricts anon to active + non-hidden clients.
  const { data: clients } = await supabase
    .from("clients")
    .select("name, slug")
    .order("name");

  return (
    <PublicShell
      heroTitle="Tell us how we're doing"
      heroSubtitle="Select your business to leave this month's feedback."
    >
      <Card>
        {clients && clients.length > 0 ? (
          <ClientPicker clients={clients} />
        ) : (
          <div className="text-center">
            <p className="eyebrow">Private links</p>
            <h2 className="mt-2 text-xl font-display text-ink-soft">
              Use the link we sent you
            </h2>
            <span className="rule rule-center mt-3" />
            <p className="mt-4 text-muted">
              Your feedback form lives at a private link we shared over email or
              WhatsApp. Can&rsquo;t find it? Reply to that message and we&rsquo;ll
              resend it.
            </p>
          </div>
        )}
      </Card>
    </PublicShell>
  );
}
