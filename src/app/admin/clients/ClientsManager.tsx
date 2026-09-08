"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ClientOverview } from "@/server/queries";
import {
  createClientRecord,
  updateClientRecord,
  setClientFlag,
  type ActionResult,
} from "@/server/clients";
import { slugify } from "@/lib/slug";
import { clientFeedbackUrl } from "@/lib/site-url";
import { formatPeriodMonth } from "@/lib/month";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea, Label } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { RatingBadge } from "@/components/ui/Badge";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";

type ServiceOption = { id: string; name: string; description: string | null };

export function ClientsManager({
  clients,
  services,
  baseUrl,
}: {
  clients: ClientOverview[];
  services: ServiceOption[];
  baseUrl: string;
}) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ClientOverview | null>(null);

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setAdding(true)}>+ Add client</Button>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Services</th>
              <th className="px-4 py-3 font-semibold">Last submission</th>
              <th className="px-4 py-3 font-semibold">Latest avg</th>
              <th className="px-4 py-3 font-semibold">Active</th>
              <th className="px-4 py-3 font-semibold">Hidden</th>
              <th className="px-4 py-3 font-semibold text-right">Link</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  No clients yet. Add your first one to get started.
                </td>
              </tr>
            ) : (
              clients.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-line transition-colors last:border-0 hover:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clients/${c.id}`}
                      className="font-semibold text-ink-soft hover:text-brand"
                    >
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted">/{c.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.service_count}</td>
                  <td className="px-4 py-3 text-muted">
                    {c.last_period ? formatPeriodMonth(c.last_period) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <RatingBadge value={c.latest_average} />
                  </td>
                  <td className="px-4 py-3">
                    <FlagToggle
                      id={c.id}
                      field="is_active"
                      value={c.is_active}
                      label={`${c.name} active`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <FlagToggle
                      id={c.id}
                      field="hide_from_public_dropdown"
                      value={c.hide_from_public_dropdown}
                      label={`${c.name} hidden from dropdown`}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CopyLinkButton url={clientFeedbackUrl(c.slug)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setEditing(c)}
                      className="focusable rounded px-2 py-1 text-xs font-semibold text-muted hover:text-ink-soft"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
      <p className="text-xs text-muted">
        Private link base: <code>{baseUrl}/f/&lt;slug&gt;</code>. Hidden clients
        never appear on the public dropdown at <code>{baseUrl}/</code>. Drag to
        reorder a client&rsquo;s services on their own page.
      </p>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add client"
        size="lg"
      >
        <ClientForm
          action={createClientRecord}
          services={services}
          onDone={() => setAdding(false)}
        />
      </Modal>

      <Modal
        open={editing != null}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.name ?? ""}`}
        size="lg"
      >
        {editing ? (
          <ClientForm
            action={updateClientRecord}
            initial={editing}
            services={services}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Modal>
    </>
  );
}

function FlagToggle({
  id,
  field,
  value,
  label,
}: {
  id: string;
  field: "is_active" | "hide_from_public_dropdown";
  value: boolean;
  label: string;
}) {
  return (
    <Toggle
      checked={value}
      label={label}
      onToggle={(next) => setClientFlag(id, field, next)}
    />
  );
}

function ClientForm({
  action,
  initial,
  services,
  onDone,
}: {
  action: (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
  initial?: ClientOverview;
  services: ServiceOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));

  const assigned = new Set(initial?.assigned_service_ids ?? []);

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  useEffect(() => {
    if (state?.ok) {
      onDone();
      router.refresh();
    }
  }, [state, onDone, router]);

  return (
    <form action={formAction} className="space-y-5">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Neil Guides"
          />
        </Field>

        <Field label="Slug" htmlFor="slug" hint="private link">
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="neil-guides"
          />
        </Field>

        <Field label="Contact email" htmlFor="contact_email" hint="optional">
          <Input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={initial?.contact_email ?? ""}
          />
        </Field>

        {!initial ? (
          <label className="flex items-end gap-2 pb-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              name="hide_from_public_dropdown"
              defaultChecked
              className="h-4 w-4 accent-[color:var(--color-brand)]"
            />
            Hide from public dropdown
          </label>
        ) : (
          <div />
        )}
      </div>

      <Field label="Notes" htmlFor="notes" hint="optional, admin-only">
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={initial?.notes ?? ""}
        />
      </Field>

      {/* Which of our services this client receives */}
      <div>
        <Label>Services this client receives</Label>
        {services.length === 0 ? (
          <p className="rounded-lg border border-line bg-field px-3 py-3 text-sm text-muted">
            No services yet. Add them on the{" "}
            <Link
              href="/admin/services"
              className="text-brand hover:underline"
              onClick={onDone}
            >
              Services
            </Link>{" "}
            page first, then edit this client.
          </p>
        ) : (
          <div className="grid gap-0.5 rounded-lg border border-line bg-field p-2 sm:grid-cols-2">
            {services.map((s) => (
              <label
                key={s.id}
                title={s.description ?? undefined}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  name="service_ids"
                  value={s.id}
                  defaultChecked={assigned.has(s.id)}
                  className="h-4 w-4 shrink-0 accent-[color:var(--color-brand)]"
                />
                <span className="text-ink-soft">{s.name}</span>
              </label>
            ))}
          </div>
        )}
        <p className="mt-1.5 text-xs text-muted">
          Tick what you deliver to this client — that&rsquo;s what shows on
          their feedback form.
        </p>
      </div>

      {state && !state.ok ? (
        <p className="text-sm text-[color:var(--color-bad)]">{state.error}</p>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : initial ? "Save changes" : "Create client"}
        </Button>
      </div>
    </form>
  );
}
