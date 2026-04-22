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
  let updated = 0;

  const results: { id: string; modelName: string; priceAverage: string }[] = [];

  for (const item of data.items) {
    const prices = await crawlPricesForItem(item);

    if (prices.length > 0) {
      const avg = calcAverage(prices);
      item.priceAverage = `${avg.toFixed(2)} PLN`;
      updated++;
    }

    results.push({ id: item.id, modelName: item.modelName, priceAverage: item.priceAverage });
  }

  await writeCollection(data);
  revalidatePath("/");

  return NextResponse.json({ updated, total: data.items.length, results });
}
