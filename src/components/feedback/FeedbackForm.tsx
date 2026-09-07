"use client";

import { useMemo, useState, useTransition } from "react";
import type { PortalClient, ExistingFeedback } from "@/lib/portal";
import { createClient } from "@/lib/supabase/client";
import { submitFeedbackAction } from "@/server/feedback";
import { formatPeriodMonth, monthInputToPeriod } from "@/lib/month";
import { StarRating } from "@/components/StarRating";
import { Card, EyebrowHeading } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";

type RatingState = { rating: number; comment: string; noteOpen: boolean };

function seedRatings(
  client: PortalClient,
  existing: ExistingFeedback | null,
): Record<string, RatingState> {
  const byService = new Map(
    (existing?.ratings ?? []).map((r) => [r.service_id, r]),
  );
  const out: Record<string, RatingState> = {};
  for (const s of client.services) {
    const e = byService.get(s.service_id);
    out[s.service_id] = {
      rating: e?.rating ?? 0,
      comment: e?.comment ?? "",
      noteOpen: Boolean(e?.comment),
    };
  }
  return out;
}

export function FeedbackForm({
  client,
  existing,
  monthInput,
}: {
  client: PortalClient;
  existing: ExistingFeedback | null;
  monthInput: string;
}) {
  const [mode, setMode] = useState<"intro" | "form" | "done">(
    existing ? "intro" : "form",
  );
  const [month, setMonth] = useState(monthInput);
  const [loadedExisting, setLoadedExisting] = useState<ExistingFeedback | null>(
    existing,
  );
  const [ratings, setRatings] = useState(() => seedRatings(client, existing));
  const [name, setName] = useState(existing?.submission.submitted_by_name ?? "");
  const [email, setEmail] = useState(
    existing?.submission.submitted_by_email ?? "",
  );
  const [wentWrong, setWentWrong] = useState(
    existing?.submission.what_went_wrong ?? "",
  );
  const [improve, setImprove] = useState(
    existing?.submission.what_can_we_improve ?? "",
  );
  const [overall, setOverall] = useState(
    existing?.submission.overall_comment ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const allRated = useMemo(
    () => client.services.every((s) => ratings[s.service_id]?.rating >= 1),
    [client.services, ratings],
  );

  function setRating(id: string, patch: Partial<RatingState>) {
    setRatings((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
  }

  async function onMonthChange(value: string) {
    setMonth(value);
    setError(null);
    // Re-check for an existing submission for the chosen month.
    const supabase = createClient();
    const { data } = await supabase.rpc("get_feedback_for_edit", {
      p_client_id: client.id,
      p_period_month: monthInputToPeriod(value),
    });
    const found =
      data && (data as ExistingFeedback).submission?.id
        ? (data as ExistingFeedback)
        : null;
    setLoadedExisting(found);
    setRatings(seedRatings(client, found));
    setName(found?.submission.submitted_by_name ?? "");
    setEmail(found?.submission.submitted_by_email ?? "");
    setWentWrong(found?.submission.what_went_wrong ?? "");
    setImprove(found?.submission.what_can_we_improve ?? "");
    setOverall(found?.submission.overall_comment ?? "");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!allRated) {
      setError("Please give every service a star rating.");
      return;
    }
    start(async () => {
      const res = await submitFeedbackAction({
        clientId: client.id,
        monthInput: month,
        submittedByName: name,
        submittedByEmail: email,
        whatWentWrong: wentWrong,
        whatCanWeImprove: improve,
        overallComment: overall,
        ratings: client.services.map((s) => ({
          service_id: s.service_id,
          rating: ratings[s.service_id].rating,
          comment: ratings[s.service_id].comment,
        })),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMode("done");
    });
  }

  if (mode === "done") {
    return (
      <Card className="anim-fade text-center">
        <p className="eyebrow">Thank you</p>
        <h2 className="mt-2 text-2xl font-display text-ink-soft">
          Feedback received
        </h2>
        <span className="rule rule-center mt-3" />
        <p className="mt-4 text-muted">
          Thanks for taking the time — your {formatPeriodMonth(monthInputToPeriod(month))}{" "}
          feedback for {client.name} is in. You can close this page.
        </p>
        <div className="mt-6">
          <Button variant="secondary" onClick={() => setMode("form")}>
            Make a change
          </Button>
        </div>
      </Card>
    );
  }

  if (mode === "intro" && loadedExisting) {
    return (
      <Card className="anim-fade text-center">
        <p className="eyebrow">Already submitted</p>
        <h2 className="mt-2 text-2xl font-display text-ink-soft">
          You&rsquo;ve submitted for {formatPeriodMonth(monthInputToPeriod(month))}
        </h2>
        <span className="rule rule-center mt-3" />
        <p className="mt-4 text-muted">
          Would you like to update it? Your previous ratings and notes will load
          in so you can adjust them.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => setMode("form")}>Update my feedback</Button>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} className="anim-fade space-y-5">
      {loadedExisting ? (
        <p className="rounded-lg bg-brand-tint px-4 py-2 text-sm text-brand">
          You already have feedback saved for{" "}
          {formatPeriodMonth(monthInputToPeriod(month))} — submitting will update it.
        </p>
      ) : null}

      <Card>
        <EyebrowHeading eyebrow="Services" title="Rate this month" />
        <ul className="mt-4 divide-y divide-line">
          {client.services.map((s) => {
            const st = ratings[s.service_id];
            return (
              <li key={s.service_id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-soft">
                      {s.name}
                      {s.description ? (
                        <span
                          title={s.description}
                          className="ml-1.5 cursor-help text-muted-dark"
                          aria-label={s.description}
                        >
                          ⓘ
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <StarRating
                    name={`rating-${s.service_id}`}
                    value={st.rating}
                    onChange={(v) => setRating(s.service_id, { rating: v })}
                    disabled={pending}
                  />
                </div>
                {st.noteOpen ? (
                  <div className="mt-2">
                    <Textarea
                      value={st.comment}
                      onChange={(e) =>
                        setRating(s.service_id, { comment: e.target.value })
                      }
                      placeholder={`Anything specific about ${s.name}?`}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRating(s.service_id, { noteOpen: true })}
                    className="mt-1 text-sm text-brand hover:underline"
                  >
                    + Add a note
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="space-y-4">
        <EyebrowHeading eyebrow="This month" title="Tell us more" />
        <Field label="Which month is this for?" htmlFor="month">
          <Input
            id="month"
            type="month"
            value={month}
            max={monthInput}
            onChange={(e) => onMonthChange(e.target.value)}
          />
        </Field>
        <Field label="What didn't go well this month?" htmlFor="ww">
          <Textarea
            id="ww"
            value={wentWrong}
            onChange={(e) => setWentWrong(e.target.value)}
          />
        </Field>
        <Field label="What can we improve?" htmlFor="imp">
          <Textarea
            id="imp"
            value={improve}
            onChange={(e) => setImprove(e.target.value)}
          />
        </Field>
        <Field label="Any general comment?" htmlFor="ov" hint="optional">
          <Textarea
            id="ov"
            value={overall}
            onChange={(e) => setOverall(e.target.value)}
          />
        </Field>
      </Card>

      <Card className="space-y-4">
        <EyebrowHeading eyebrow="You" title="Who's submitting?" />
        <p className="text-sm text-muted">
          Both optional — leave them blank if you&rsquo;d rather stay anonymous.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="nm" hint="optional">
            <Input id="nm" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="em" hint="optional">
            <Input
              id="em"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {error ? (
        <p className="rounded-lg bg-[color:var(--color-bad)]/10 px-4 py-2 text-sm text-[color:var(--color-bad)]">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">
          {allRated
            ? "All services rated."
            : `${client.services.filter((s) => ratings[s.service_id]?.rating >= 1).length}/${client.services.length} services rated`}
        </p>
        <Button type="submit" disabled={pending || !allRated} size="md">
          {pending
            ? "Submitting…"
            : loadedExisting
              ? "Update feedback"
              : "Submit feedback"}
        </Button>
      </div>
    </form>
  );
}
