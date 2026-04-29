"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PriceChangeToast, { type PriceChangeNotification } from "./PriceChangeToast";

type Status = "idle" | "loading" | "done" | "error";

const TOAST_DISMISS_MS = 8000;

export default function PriceUpdateButton() {
  const [status, setStatus] = useState<Status>("idle");
  const [counts, setCounts] = useState<{ updated: number; total: number } | null>(null);
  const [notifications, setNotifications] = useState<PriceChangeNotification[]>([]);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissAll = useCallback(() => setNotifications([]), []);

  const handleDismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  useEffect(() => {
    if (notifications.length === 0) return;
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(dismissAll, TOAST_DISMISS_MS);
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [notifications, dismissAll]);

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
        if (Array.isArray(data.changes) && data.changes.length > 0) {
          setNotifications(
            data.changes.map(
              (c: Omit<PriceChangeNotification, "id">, i: number) => ({ ...c, id: Date.now() + i })
            )
          );
        }
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
    <>
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
      >
        {label}
      </button>
      <PriceChangeToast notifications={notifications} onDismiss={handleDismiss} />
    </>
  );
}
