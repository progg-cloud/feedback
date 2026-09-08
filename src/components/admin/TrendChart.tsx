"use client";

import dynamic from "next/dynamic";

/**
 * Lazy wrapper for the Recharts line chart. Recharts is a large dependency,
 * so it's split out of the main bundle and loaded only when a chart is
 * actually on screen. A matching-height placeholder avoids layout shift.
 */
const TrendChartImpl = dynamic(
  () => import("./TrendChartImpl").then((m) => m.TrendChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 w-full animate-pulse rounded-lg bg-white/[0.04]" />
    ),
  },
);

export function TrendChart(props: {
  data: { label: string; average: number | null }[];
}) {
  return <TrendChartImpl {...props} />;
}
