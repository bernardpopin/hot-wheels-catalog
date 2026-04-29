import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PriceSource } from "@/app/lib/priceConfig";
import type { CollectionItem } from "@/app/lib/collection";

// Hoist a mutable array so we can control PRICE_SOURCES per test.
const { mockSources } = vi.hoisted(() => ({
  mockSources: [] as PriceSource[],
}));

vi.mock("@/app/lib/priceConfig", () => ({
  PRICE_SOURCES: mockSources,
}));

import { calcAverage, crawlPricesForItem } from "@/app/lib/priceCrawler";

const mockFetch = vi.fn();

const baseItem: CollectionItem = {
  id: "1",
  modelName: "Datsun 240Z Custom",
  carBrand: "Nissan",
  carModel: "240Z",
  carProductionYear: null,
  releaseYear: 2021,
  yearOnChassis: null,
  series: "",
  color: "Orange",
  modelNumber: "HNT20",
  priceAverage: [],
  openWindow: false,
  bigWing: false,
  frontBoltPositionOnEdge: false,
  backBoltPositionOnEdge: false,
  quantity: 1,
};

function makeSource(overrides?: Partial<PriceSource>): PriceSource {
  return {
    name: "TestSite",
    buildUrl: (q) => `https://test.com/search?q=${encodeURIComponent(q)}`,
    priceRegex: /(\d+)\s*z[łl]/g,
    ...overrides,
  };
}

function mockOkResponse(body: string) {
  mockFetch.mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(body),
  });
}

function mockErrorResponse() {
  mockFetch.mockResolvedValue({ ok: false, status: 500 });
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockSources.splice(0); // reset to empty before each test
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// calcAverage
// ---------------------------------------------------------------------------

describe("calcAverage", () => {
  it("returns the average of multiple prices", () => {
    expect(calcAverage([10, 20, 30])).toBe(20);
  });

  it("returns the value unchanged when the array has a single element", () => {
    expect(calcAverage([42])).toBe(42);
  });

  it("handles decimal prices", () => {
    expect(calcAverage([1.5, 2.5])).toBe(2);
  });

  it("handles non-round averages", () => {
    expect(calcAverage([1, 2])).toBeCloseTo(1.5);
  });
});

// ---------------------------------------------------------------------------
// crawlPricesForItem
// ---------------------------------------------------------------------------

describe("crawlPricesForItem", () => {
  describe("when PRICE_SOURCES is empty", () => {
    it("returns an empty array without fetching anything", async () => {
      const result = await crawlPricesForItem(baseItem);
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("search query", () => {
    it("passes 'Hot Wheels <modelName>' to the source's buildUrl", async () => {
      const buildUrl = vi.fn((q: string) => `https://test.com?q=${q}`);
      mockSources.push(makeSource({ buildUrl }));
      mockOkResponse("");

      await crawlPricesForItem({ ...baseItem, modelName: "Silvia S15" });

      expect(buildUrl).toHaveBeenCalledWith("Hot Wheels Silvia S15");
    });

    it("includes the model name URL-encoded in the fetch call", async () => {
      mockSources.push(makeSource());
      mockOkResponse("");

      await crawlPricesForItem({ ...baseItem, modelName: "90' Acura NSX" });

      const fetchedUrl = mockFetch.mock.calls[0][0] as string;
      expect(fetchedUrl).toContain(encodeURIComponent("Hot Wheels 90' Acura NSX"));
    });
  });

  describe("price extraction", () => {
    it("extracts integer prices matching the source regex", async () => {
      mockSources.push(makeSource());
      mockOkResponse("Price: 25 zł, another 30 zł");

      const result = await crawlPricesForItem(baseItem);
      expect(result).toEqual([25, 30]);
    });

    it("handles decimal prices with dot separator", async () => {
      mockSources.push(
        makeSource({ priceRegex: /(\d[\d.]*)\s*z[łl]/g })
      );
      mockOkResponse("12.50 zł 99.99 zł");

      const result = await crawlPricesForItem(baseItem);
      expect(result).toEqual([12.5, 99.99]);
    });

    it("handles Polish decimal comma ('12,50 zł')", async () => {
      mockSources.push(
        makeSource({ priceRegex: /(\d[\d\s]*[,.]?\d*)\s*z[łl]/g })
      );
      mockOkResponse("12,50 zł");

      const result = await crawlPricesForItem(baseItem);
      expect(result).toEqual([12.5]);
    });

    it("handles Polish thousands separator ('1 234,50 zł')", async () => {
      mockSources.push(
        makeSource({ priceRegex: /(\d[\d\s]*[,.]?\d*)\s*z[łl]/g })
      );
      mockOkResponse("1 234,50 zł");

      const result = await crawlPricesForItem(baseItem);
      expect(result).toEqual([1234.5]);
    });

    it("ignores zero prices", async () => {
      mockSources.push(makeSource());
      // The regex wouldn't normally match "0 zł" with \d+ unless it starts with non-zero,
      // but if somehow "0" is captured it should be excluded
      mockOkResponse("0 zł 15 zł");

      const result = await crawlPricesForItem(baseItem);
      // "0" matches the regex but is filtered out (value > 0 check)
      expect(result).not.toContain(0);
      expect(result).toContain(15);
    });

    it("returns empty array when no prices match the regex", async () => {
      mockSources.push(makeSource());
      mockOkResponse("<html>No prices here</html>");

      const result = await crawlPricesForItem(baseItem);
      expect(result).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("skips a source that returns a non-ok HTTP status", async () => {
      mockSources.push(makeSource());
      mockErrorResponse();

      const result = await crawlPricesForItem(baseItem);
      expect(result).toEqual([]);
    });

    it("skips a source that throws a network error", async () => {
      mockSources.push(makeSource());
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await crawlPricesForItem(baseItem);
      expect(result).toEqual([]);
    });

    it("skips a source that rejects (e.g. timeout)", async () => {
      mockSources.push(makeSource());
      const error = new DOMException("The operation was aborted", "AbortError");
      mockFetch.mockRejectedValue(error);

      const result = await crawlPricesForItem(baseItem);
      expect(result).toEqual([]);
    });

    it("continues to next source after a failure", async () => {
      mockSources.push(
        makeSource({ name: "Failing", buildUrl: () => "https://fail.com" }),
        makeSource({ name: "Working", buildUrl: () => "https://ok.com" })
      );
      mockFetch
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("20 zł") });

      const result = await crawlPricesForItem(baseItem);
      expect(result).toEqual([20]);
    });
  });

  describe("multiple sources", () => {
    it("aggregates prices from all sources", async () => {
      mockSources.push(
        makeSource({ name: "Site1", buildUrl: () => "https://site1.com" }),
        makeSource({ name: "Site2", buildUrl: () => "https://site2.com" })
      );
      mockFetch
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("10 zł 20 zł") })
        .mockResolvedValueOnce({ ok: true, text: () => Promise.resolve("30 zł") });

      const result = await crawlPricesForItem(baseItem);
      expect(result).toEqual([10, 20, 30]);
    });

    it("fetches all sources in order", async () => {
      const buildUrl1 = vi.fn(() => "https://site1.com");
      const buildUrl2 = vi.fn(() => "https://site2.com");
      mockSources.push(
        makeSource({ buildUrl: buildUrl1 }),
        makeSource({ buildUrl: buildUrl2 })
      );
      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve("") });

      await crawlPricesForItem(baseItem);

      expect(buildUrl1).toHaveBeenCalledOnce();
      expect(buildUrl2).toHaveBeenCalledOnce();
    });
  });

  describe("MAX_PRICES limit (50)", () => {
    it("caps the total returned prices at 50", async () => {
      const html = Array.from({ length: 50 }, (_, i) => `${i + 1} zł`).join(" ");
      mockSources.push(makeSource());
      mockOkResponse(html);

      const result = await crawlPricesForItem(baseItem);
      expect(result).toHaveLength(50);
    });

    it("stops fetching additional sources once 10 prices are collected", async () => {
      const html = Array.from({ length: 50 }, (_, i) => `${i + 1} zł`).join(" ");
      mockSources.push(
        makeSource({ name: "Site1", buildUrl: () => "https://site1.com" }),
        makeSource({ name: "Site2", buildUrl: () => "https://site2.com" })
      );
      mockFetch.mockResolvedValue({ ok: true, text: () => Promise.resolve(html) });

      await crawlPricesForItem(baseItem);

      // Site1 fills up 10 prices; Site2 should never be fetched
      expect(mockFetch).toHaveBeenCalledOnce();
    });
  });

  describe("request options", () => {
    it("sends an AbortSignal timeout with each request", async () => {
      mockSources.push(makeSource());
      mockOkResponse("");

      await crawlPricesForItem(baseItem);

      const [, init] = mockFetch.mock.calls[0];
      expect(init.signal).toBeDefined();
    });

    it("sends browser-like Accept-Language header", async () => {
      mockSources.push(makeSource());
      mockOkResponse("");

      await crawlPricesForItem(baseItem);

      const [, init] = mockFetch.mock.calls[0];
      expect(init.headers["Accept-Language"]).toContain("pl");
    });
  });
});
