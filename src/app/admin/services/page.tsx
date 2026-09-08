import { listServicesOverview } from "@/server/queries";
import { EyebrowHeading } from "@/components/ui/Card";
import { DownloadCsvButton } from "@/components/admin/DownloadCsvButton";
import { ServicesManager } from "./ServicesManager";

export const metadata = { title: "Services — Admin" };

export default async function ServicesPage() {
  const services = await listServicesOverview();

  const csvRows = services.map((s) => ({
    name: s.name,
    description: s.description ?? "",
    clients_receiving: s.client_count,
    has_ratings: s.has_ratings ? "yes" : "no",
    active: s.is_active ? "yes" : "no",
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <EyebrowHeading
          eyebrow="Admin"
          title="Services"
          subtitle="The master list of everything the agency delivers. Assign these to clients on each client's page."
        />
        <DownloadCsvButton rows={csvRows} filename="services.csv" />
      </div>
      <ServicesManager services={services} />
    </div>
  );
}
