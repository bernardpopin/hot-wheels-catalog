import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/app/lib/collection";
import { PRICE_SOURCES, PRICE_CHANGE_THRESHOLD_PERCENT } from "@/app/lib/priceConfig";
import { calcAverage, crawlPricesForItem } from "@/app/lib/priceCrawler";

export type PriceChange = {
  modelName: string;
  oldPrice: string;
  newPrice: string;
  changePercent: number;
};

export async function POST() {
  if (PRICE_SOURCES.length === 0) {
    return NextResponse.json(
      {
        error:
          "No price sources configured. Add at least one entry to PRICE_SOURCES in app/lib/priceConfig.ts.",
      },
      { status: 400 }
    );
  }

  const data = await readCollection();
  const today = new Date().toISOString().split("T")[0];
  let updated = 0;
  const changes: PriceChange[] = [];

  for (const item of data.items) {
    // Get the most recent price entry before today (previous price)
    const previousEntry = [...item.priceAverage]
      .filter((e) => e.date < today)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    const prices = await crawlPricesForItem(item);

    if (prices.length > 0) {
      const avg = calcAverage(prices);
      const newEntry = { date: today, price: `${avg.toFixed(2)} PLN` };
      const existingIndex = item.priceAverage.findIndex((e) => e.date === today);
      if (existingIndex >= 0) {
        item.priceAverage[existingIndex] = newEntry;
      } else {
        item.priceAverage.push(newEntry);
      }
      updated++;

      if (previousEntry) {
        const oldPrice = parseFloat(previousEntry.price);
        if (!isNaN(oldPrice) && oldPrice > 0) {
          const changePercent = ((avg - oldPrice) / oldPrice) * 100;
          if (Math.abs(changePercent) >= PRICE_CHANGE_THRESHOLD_PERCENT) {
            changes.push({
              modelName: item.modelName,
              oldPrice: previousEntry.price,
              newPrice: newEntry.price,
              changePercent: Math.round(changePercent * 10) / 10,
            });
          }
        }
      }
    }
  }

  await writeCollection(data);
  revalidatePath("/");

  return NextResponse.json({ updated, total: data.items.length, changes });
}
