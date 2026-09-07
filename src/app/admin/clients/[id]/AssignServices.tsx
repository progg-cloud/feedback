"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AssignedService } from "@/server/queries";
import type { Tables } from "@db";
import {
  assignService,
  unassignService,
  reorderServices,
} from "@/server/assignments";
import { Card, EyebrowHeading } from "@/components/ui/Card";
import { clsx } from "@/lib/clsx";

type ServiceRow = Tables<"services">;

export function AssignServices({
  clientId,
  assigned,
  available,
}: {
  clientId: string;
  assigned: AssignedService[];
  available: ServiceRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [order, setOrder] = useState(assigned);
  const [dragId, setDragId] = useState<string | null>(null);

  // Keep local order in sync when server data changes after a refresh.
  const assignedKey = assigned.map((a) => a.service_id).join(",");
  const [lastKey, setLastKey] = useState(assignedKey);
  if (assignedKey !== lastKey) {
    setOrder(assigned);
    setLastKey(assignedKey);
  }

  function add(serviceId: string) {
    start(async () => {
      const res = await assignService(clientId, serviceId);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  }

  function remove(serviceId: string) {
    start(async () => {
      const res = await unassignService(clientId, serviceId);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const next = [...order];
    const from = next.findIndex((s) => s.service_id === dragId);
    const to = next.findIndex((s) => s.service_id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
    setDragId(null);
    start(async () => {
      const res = await reorderServices(
        clientId,
        next.map((s) => s.service_id),
      );
      if (!res.ok) {
        alert(res.error);
        router.refresh();
      }
    });
  }

  return (
    <div className={clsx("grid gap-5 md:grid-cols-2", pending && "opacity-70")}>
      {/* Available */}
      <Card>
        <EyebrowHeading eyebrow="Available" title="Services not assigned" />
        <ul className="mt-4 space-y-2">
          {available.length === 0 ? (
            <li className="rounded-lg bg-mist px-3 py-6 text-center text-sm text-muted">
              Every active service is assigned. Add more on the{" "}
              <a href="/admin/services" className="text-brand hover:underline">
                Services
              </a>{" "}
              page.
            </li>
          ) : (
            available.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => add(s.id)}
                  disabled={pending}
                  className="focusable flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left text-sm hover:border-brand hover:bg-brand-tint"
                >
                  <span>
                    <span className="font-medium text-ink-soft">{s.name}</span>
                    {s.description ? (
                      <span className="block text-xs text-muted">
                        {s.description}
                      </span>
                    ) : null}
                  </span>
                  <span aria-hidden className="text-brand">
                    + add
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </Card>

      {/* Assigned */}
      <Card>
        <EyebrowHeading
          eyebrow="Assigned"
          title="This client's services"
        />
        <p className="mt-2 text-xs text-muted">
          Drag to reorder — this is the order the client sees on their form.
        </p>
        <ul className="mt-4 space-y-2">
          {order.length === 0 ? (
            <li className="rounded-lg bg-mist px-3 py-6 text-center text-sm text-muted">
              Nothing assigned yet. Add services from the left — until then this
              client sees a polite &ldquo;no services&rdquo; message.
            </li>
          ) : (
            order.map((s, i) => (
              <li
                key={s.service_id}
                draggable
                onDragStart={() => setDragId(s.service_id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(s.service_id)}
                className={clsx(
                  "flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-sm",
                  dragId === s.service_id && "opacity-40",
                )}
              >
                <span
                  aria-hidden
                  className="cursor-grab select-none text-muted-dark"
                >
                  ⠿
                </span>
                <span className="w-5 text-xs text-muted">{i + 1}</span>
                <span className="flex-1">
                  <span className="font-medium text-ink-soft">{s.name}</span>
                  {s.description ? (
                    <span className="block text-xs text-muted">
                      {s.description}
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => remove(s.service_id)}
                  disabled={pending}
                  aria-label={`Remove ${s.name}`}
                  className="focusable rounded px-2 py-1 text-xs font-semibold text-[color:var(--color-bad)] hover:underline"
                >
                  remove
                </button>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  );
}
