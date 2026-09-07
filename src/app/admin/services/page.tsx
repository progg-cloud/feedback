import { listServicesOverview } from "@/server/queries";
import { EyebrowHeading } from "@/components/ui/Card";
import { ServicesManager } from "./ServicesManager";

export const metadata = { title: "Services — Admin" };

export default async function ServicesPage() {
  const services = await listServicesOverview();

  return (
    <div className="space-y-6">
      <EyebrowHeading
        eyebrow="Admin"
        title="Services"
        subtitle="The master list of everything the agency delivers. Assign these to clients on each client's page."
      />
      <ServicesManager services={services} />
    </div>
  );
}
