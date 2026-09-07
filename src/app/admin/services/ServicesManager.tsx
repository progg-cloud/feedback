"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ServiceOverview } from "@/server/queries";
import {
  createService,
  updateService,
  setServiceActive,
  deleteService,
} from "@/server/services";
import type { ActionResult } from "@/server/clients";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";

export function ServicesManager({
  services,
}: {
  services: ServiceOverview[];
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ServiceOverview | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  function remove(s: ServiceOverview) {
    if (!confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteService(s.id);
      if (!res.ok) alert(res.error);
      else router.refresh();
    });
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setAdding(true)}>+ Add service</Button>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Service</th>
              <th className="px-4 py-3 font-semibold">Clients</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  No services yet. Add the ones your agency offers.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr key={s.id} className="border-b border-line transition-colors last:border-0 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-ink-soft">{s.name}</div>
                    {s.description ? (
                      <div className="max-w-md text-xs text-muted">
                        {s.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {s.client_count}
                    {s.has_ratings ? (
                      <Badge tone="neutral" className="ml-2">
                        has ratings
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Toggle
                      checked={s.is_active}
                      label={`${s.name} active`}
                      onToggle={(next) => setServiceActive(s.id, next)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(s)}
                      className="focusable rounded px-2 py-1 text-xs font-semibold text-muted hover:text-ink-soft"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={s.has_ratings}
                      title={
                        s.has_ratings
                          ? "Has ratings attached — deactivate instead"
                          : undefined
                      }
                      onClick={() => remove(s)}
                      className="focusable ml-1 rounded px-2 py-1 text-xs font-semibold text-[color:var(--color-bad)] hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add service">
        <ServiceForm action={createService} onDone={() => setAdding(false)} />
      </Modal>
      <Modal
        open={editing != null}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.name ?? ""}`}
      >
        {editing ? (
          <ServiceForm
            action={updateService}
            initial={editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Modal>
    </>
  );
}

function ServiceForm({
  action,
  initial,
  onDone,
}: {
  action: (
    prev: ActionResult | null,
    fd: FormData,
  ) => Promise<ActionResult>;
  initial?: ServiceOverview;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.ok) {
      onDone();
      router.refresh();
    }
  }, [state, onDone, router]);

  return (
    <form action={formAction} className="space-y-4">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
      <Field label="Name" htmlFor="s-name">
        <Input
          id="s-name"
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          placeholder="Video Editing"
        />
      </Field>
      <Field
        label="Description"
        htmlFor="s-desc"
        hint="optional — shown as a tooltip on the client form"
      >
        <Textarea
          id="s-desc"
          name="description"
          defaultValue={initial?.description ?? ""}
        />
      </Field>
      {state && !state.ok ? (
        <p className="text-sm text-[color:var(--color-bad)]">{state.error}</p>
      ) : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : initial ? "Save changes" : "Create service"}
        </Button>
      </div>
    </form>
  );
}
