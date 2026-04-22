import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/app/lib/collection";
import { PRICE_SOURCES } from "@/app/lib/priceConfig";
import { calcAverage, crawlPricesForItem } from "@/app/lib/priceCrawler";

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

  for (const item of data.items) {
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
    }
  }

  await writeCollection(data);
  revalidatePath("/");

  return NextResponse.json({ updated, total: data.items.length });
}
