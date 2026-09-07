import { listClientsOverview } from "@/server/queries";
import { siteUrl } from "@/lib/site-url";
import { EyebrowHeading } from "@/components/ui/Card";
import { ClientsManager } from "./ClientsManager";

export const metadata = { title: "Clients — Admin" };

export default async function ClientsPage() {
  const clients = await listClientsOverview();

  return (
    <div className="space-y-6">
      <EyebrowHeading
        eyebrow="Admin"
        title="Clients"
        subtitle="Create a client, assign the services you deliver to them, then send them their private feedback link."
      />
      <ClientsManager clients={clients} baseUrl={siteUrl()} />
    </div>
  );
}
