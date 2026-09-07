import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient, getClientAssignments } from "@/server/queries";
import { clientFeedbackUrl } from "@/lib/site-url";
import { EyebrowHeading } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";
import { AssignServices } from "./AssignServices";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  return { title: client ? `${client.name} — Admin` : "Client — Admin" };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClient(id);
  if (!client) notFound();

  const { assigned, available } = await getClientAssignments(id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <EyebrowHeading
          eyebrow={client.is_active ? "Client" : "Client · inactive"}
          title={client.name}
          subtitle={`Private link: ${clientFeedbackUrl(client.slug)}`}
        />
        <div className="flex gap-2">
          <CopyLinkButton url={clientFeedbackUrl(client.slug)} />
          <ButtonLink
            href={`/admin/clients/${id}/report`}
            variant="secondary"
            size="sm"
          >
            View report
          </ButtonLink>
        </div>
      </div>

      <p className="text-sm text-muted">
        <Link href="/admin/clients" className="hover:text-brand">
          ← All clients
        </Link>
      </p>

      <AssignServices
        clientId={id}
        assigned={assigned}
        available={available}
      />
    </div>
  );
}
