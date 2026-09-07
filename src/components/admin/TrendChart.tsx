"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { colors } from "@/lib/theme";

export function TrendChart({
  data,
}: {
  data: { label: string; average: number | null }[];
}) {
  const points = data.filter((d) => d.average != null);
  if (points.length === 0) {
    return (
      <div className="grid h-56 place-items-center text-sm text-muted">
        No ratings yet — the trend appears once feedback comes in.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={colors.line} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: colors.muted }}
            tickLine={false}
            axisLine={{ stroke: colors.line }}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fontSize: 12, fill: colors.muted }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? value.toFixed(2) : String(value),
              "Avg rating",
            ]}
            cursor={{ stroke: colors.line }}
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${colors.line}`,
              background: colors.paper,
              color: colors.inkSoft,
              fontSize: 12,
            }}
            labelStyle={{ color: colors.muted }}
            itemStyle={{ color: colors.inkSoft }}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke={colors.brand}
            strokeWidth={2.5}
            dot={{ r: 3, fill: colors.brand }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
