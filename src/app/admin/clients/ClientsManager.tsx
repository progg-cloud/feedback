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
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { RatingBadge } from "@/components/ui/Badge";
import { CopyLinkButton } from "@/components/admin/CopyLinkButton";

export function ClientsManager({
  clients,
  baseUrl,
}: {
  clients: ClientOverview[];
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
                <tr key={c.id} className="border-b border-line transition-colors last:border-0 hover:bg-white/5">
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
        never appear on the public dropdown at <code>{baseUrl}/</code>.
      </p>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add client">
        <ClientForm action={createClientRecord} onDone={() => setAdding(false)} />
      </Modal>

      <Modal
        open={editing != null}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.name ?? ""}`}
      >
        {editing ? (
          <ClientForm
            action={updateClientRecord}
            initial={editing}
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
  onDone,
}: {
  action: (
    prev: ActionResult | null,
    fd: FormData,
  ) => Promise<ActionResult>;
  initial?: ClientOverview;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, null);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));

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
    <form action={formAction} className="space-y-4">
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

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

      <Field
        label="Slug"
        htmlFor="slug"
        hint="used in the private link"
      >
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

      <Field label="Notes" htmlFor="notes" hint="optional, admin-only">
        <Textarea id="notes" name="notes" defaultValue={initial?.notes ?? ""} />
      </Field>

      {!initial ? (
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="hide_from_public_dropdown"
            defaultChecked
            className="h-4 w-4 accent-[color:var(--color-brand)]"
          />
          Hide from the public dropdown (recommended)
        </label>
      ) : null}

      {state && !state.ok ? (
        <p className="text-sm text-[color:var(--color-bad)]">{state.error}</p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
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
