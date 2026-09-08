import { listClientsOverview, listActiveServices } from "@/server/queries";
import { siteUrl } from "@/lib/site-url";
import { formatPeriodMonth } from "@/lib/month";
import { EyebrowHeading } from "@/components/ui/Card";
import { DownloadCsvButton } from "@/components/admin/DownloadCsvButton";
import { ClientsManager } from "./ClientsManager";

export const metadata = { title: "Clients — Admin" };

export default async function ClientsPage() {
  const [clients, services] = await Promise.all([
    listClientsOverview(),
    listActiveServices(),
  ]);

  const csvRows = clients.map((c) => ({
    name: c.name,
    slug: c.slug,
    contact_email: c.contact_email ?? "",
    services_assigned: c.service_count,
    last_submission: c.last_period ? formatPeriodMonth(c.last_period) : "",
    latest_average: c.latest_average ?? "",
    active: c.is_active ? "yes" : "no",
    hidden_from_dropdown: c.hide_from_public_dropdown ? "yes" : "no",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <EyebrowHeading
          eyebrow="Admin"
          title="Clients"
          subtitle="Create a client, assign the services you deliver to them, then send them their private feedback link."
        />
        <DownloadCsvButton rows={csvRows} filename="clients.csv" />
      </div>
      <ClientsManager
        clients={clients}
        services={services}
        baseUrl={siteUrl()}
      />
    </div>
  );
}
