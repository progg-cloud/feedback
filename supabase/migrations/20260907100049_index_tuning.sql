-- Cover the client_services -> services foreign key (used by the
-- per-service admin report: "how many clients receive each service").
create index idx_client_services_service on public.client_services(service_id);

-- Redundant: clients.slug already has a unique-constraint index.
drop index if exists public.idx_clients_slug;
