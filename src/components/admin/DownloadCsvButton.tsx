"use client";

import { toCsv } from "@/lib/csv";
import { Button } from "@/components/ui/Button";

/** Generates a CSV client-side and prompts the browser to save it. */
export function DownloadCsvButton({
  rows,
  filename,
  columns,
  label = "Download CSV",
}: {
  rows: Record<string, unknown>[];
  filename: string;
  columns?: string[];
  label?: string;
}) {
  function download() {
    const csv = toCsv(rows, columns);
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={download}
      disabled={rows.length === 0}
    >
      {label}
    </Button>
  );
}
