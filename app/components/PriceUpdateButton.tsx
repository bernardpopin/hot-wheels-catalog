"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "done" | "error";

export default function PriceUpdateButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [counts, setCounts] = useState<{ updated: number; total: number } | null>(null);

  async function handleClick() {
    if (status === "loading") return;

    setStatus("loading");
    setCounts(null);

    try {
      const res = await fetch("/api/update-prices", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
      } else {
        setCounts({ updated: data.updated, total: data.total });
        setStatus("done");
      }
    } catch {
      setStatus("error");
    }

    setTimeout(() => setStatus("idle"), 5000);
  }

  const label =
    status === "loading"
      ? "Updating…"
      : status === "done" && counts
        ? `Updated ${counts.updated}/${counts.total}`
        : status === "error"
          ? "Error — retry?"
          : "AI Update prices";

  return (
    <button
      onClick={handleClick}
      disabled={status === "loading"}
      className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
    >
      {label}
    </button>
  );
}
