export type PriceSource = {
  name: string;
  /** Builds the search URL from a query string like "Hot Wheels Datsun 240Z Custom Red" */
  buildUrl: (query: string) => string;
  /**
   * Regex with one capturing group that matches the price number in the HTML.
   * Examples:
   *   - Polish złoty:  /(\d[\d\s]*[,.]?\d*)\s*zł/g
   *   - PLN label:     /(\d[\d\s]*[,.]?\d*)\s*PLN/gi
   * The number may contain spaces as thousands separators (e.g. "1 234,50").
   */
  priceRegex: RegExp;
};

/** Minimum % price change (absolute value) that triggers a notification. */
export const PRICE_CHANGE_THRESHOLD_PERCENT = 5;

export const PRICE_SOURCES: PriceSource[] = [                                                                                                                                                                      
  {
    name: "Allegro",
    buildUrl: (q) => `https://allegro.pl/listing?string=${encodeURIComponent(q)}`,
    priceRegex: /(\d[\d\s]*[,.]?\d*)\s*z[łl]/g,
  },
  {
    name: "OLX",
    buildUrl: (q) => `https://www.olx.pl/oferty/q-${encodeURIComponent(q).replace(/%20/g, "-")}/`,
    priceRegex: /(\d[\d\s]*[,.]?\d*)\s*z[łl]/g,
  }
];