import Link from "next/link";
import PriceUpdateButton from "./PriceUpdateButton";
import { readCollection } from "@/app/lib/collection";

export default async function TopBar() {
  const { items } = await readCollection();

  let total = 0;
  for (const item of items) {
    const latest = [...item.priceAverage].sort((a, b) => b.date.localeCompare(a.date))[0];
    if (latest) {
      const price = parseFloat(latest.price);
      if (!isNaN(price)) total += price * item.quantity;
    }
  }
  const totalStr = total > 0 ? `${total.toFixed(2)} PLN` : "—";

  return (
    <header className="w-full border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Hot Wheels Car Collection
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Total value: <span className="font-medium text-zinc-900 dark:text-zinc-100">{totalStr}</span>
          </span>
          <div className="flex gap-2">
            <PriceUpdateButton />
            <Link
              href="/?assistant=true"
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
            >
              AI Assistant
            </Link>
            <Link
              href="/"
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
            >
              Add a car
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
