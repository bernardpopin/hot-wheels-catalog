"use client";

import { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { PriceEntry } from "@/app/lib/collection";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

type Range = "1m" | "3m" | "6m" | "1y" | "all";

const RANGES: { label: string; value: Range }[] = [
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "All", value: "all" },
];

export function filterByRange(entries: PriceEntry[], range: Range): PriceEntry[] {
  if (range === "all") return entries;
  const cutoff = new Date();
  if (range === "1m") cutoff.setMonth(cutoff.getMonth() - 1);
  else if (range === "3m") cutoff.setMonth(cutoff.getMonth() - 3);
  else if (range === "6m") cutoff.setMonth(cutoff.getMonth() - 6);
  else if (range === "1y") cutoff.setFullYear(cutoff.getFullYear() - 1);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  return entries.filter((e) => e.date >= cutoffStr);
}

export default function PriceChart({ priceAverage }: { priceAverage: PriceEntry[] }) {
  const [range, setRange] = useState<Range>("all");

  if (priceAverage.length === 0) return null;

  const filtered = filterByRange(priceAverage, range);
  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  const labels = sorted.map((e) => e.date);
  const values = sorted.map((e) => parseFloat(e.price));

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.08)",
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          label: (ctx: any) => `${ctx.raw} PLN`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 } },
      },
      y: {
        grid: { color: "rgba(0,0,0,0.06)" },
        ticks: {
          font: { size: 11 },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (val: any) => `${val} PLN`,
        },
      },
    },
  };

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Price history
        </span>
        <div className="flex gap-1">
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                range === value
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No data for this period.</p>
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <Line data={chartData} options={options as any} />
      )}
    </div>
  );
}
