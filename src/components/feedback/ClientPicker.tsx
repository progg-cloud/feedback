"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Field";

export function ClientPicker({
  clients,
}: {
  clients: { name: string; slug: string }[];
}) {
  const router = useRouter();
  const [slug, setSlug] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (slug) router.push(`/f/${slug}`);
      }}
    >
      <div>
        <Label htmlFor="client">Your Business</Label>
        <select
          id="client"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          className="focusable w-full rounded-lg border border-[color:var(--color-line-strong)] bg-field px-3 py-2.5 text-sm text-ink-soft transition-colors hover:border-white/25 focus:border-brand"
        >
          <option value="" disabled>
            Select…
          </option>
          {clients.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={!slug} className="w-full">
        Continue
      </Button>
    </form>
  );
}
