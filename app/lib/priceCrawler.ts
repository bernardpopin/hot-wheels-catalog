import type { CollectionItem } from "@/app/lib/collection";
import { PRICE_SOURCES } from "@/app/lib/priceConfig";

const MAX_PRICES = 10;

function buildSearchQuery(item: CollectionItem): string {
  return `Hot Wheels ${item.modelName}`.trim();
}

/**
 * Parses price numbers out of raw HTML using the source's regex.
 * Handles:
 *  - Polish format with space thousands separator: "1 234,50"
 *  - Standard decimal dot: "12.50"
 *  - Integers: "15"
 */
function extractPrices(html: string, regex: RegExp): number[] {
  const prices: number[] = [];
  // Clone regex so we don't mutate the shared lastIndex
  const pattern = new RegExp(regex.source, regex.flags);
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null && prices.length < MAX_PRICES) {
    const raw = match[1]
      .replace(/\s/g, "")   // strip thousands-separator spaces
      .replace(",", ".");   // normalise decimal comma → dot
    const value = parseFloat(raw);
    if (!isNaN(value) && value > 0) {
      prices.push(value);
    }
  }

  return prices;
}

export function calcAverage(prices: number[]): number {
  return prices.reduce((sum, p) => sum + p, 0) / prices.length;
}

export async function crawlPricesForItem(
  item: CollectionItem
): Promise<number[]> {
  const query = buildSearchQuery(item);
  const allPrices: number[] = [];

  for (const source of PRICE_SOURCES) {
    if (allPrices.length >= MAX_PRICES) break;

    const url = source.buildUrl(query);

    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "pl-PL,pl;q=0.9,en-US;q=0.8",
        },
        signal: AbortSignal.timeout(10_000),
      });

      if (!res.ok) continue;

      const html = await res.text();
      const prices = extractPrices(html, source.priceRegex);
      allPrices.push(...prices);
    } catch {
      // Network error or timeout — skip this source
    }
  }

  return allPrices.slice(0, MAX_PRICES);
}
