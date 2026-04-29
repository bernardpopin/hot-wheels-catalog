"use client";

import type { PriceChange } from "@/app/api/update-prices/route";

export type PriceChangeNotification = PriceChange & { id: number };

type Props = {
  notifications: PriceChangeNotification[];
  onDismiss: (id: number) => void;
};

export default function PriceChangeToast({ notifications, onDismiss }: Props) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((change) => {
        const isUp = change.changePercent > 0;
        return (
          <div
            key={change.id}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          >
            <span className={`mt-0.5 text-lg leading-none ${isUp ? "text-red-500" : "text-green-500"}`}>
              {isUp ? "↑" : "↓"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 truncate">
                {change.modelName}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {change.oldPrice} → {change.newPrice}
                <span className={`ml-2 font-medium ${isUp ? "text-red-500" : "text-green-500"}`}>
                  {isUp ? "+" : ""}{change.changePercent}%
                </span>
              </p>
            </div>
            <button
              onClick={() => onDismiss(change.id)}
              className="mt-0.5 shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
