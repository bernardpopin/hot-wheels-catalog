import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PriceSource } from "@/app/lib/priceConfig";
import type { CollectionItem } from "@/app/lib/collection";

// Hoist a mutable array so we can control PRICE_SOURCES per test.
const { mockSources } = vi.hoisted(() => ({
  mockSources: [] as PriceSource[],
}));

vi.mock("@/app/lib/priceConfig", () => ({
  PRICE_SOURCES: mockSources,
}));

vi.mock("@/app/lib/collection", () => ({
  readCollection: vi.fn(),
  writeCollection: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/app/lib/priceCrawler", () => ({
  crawlPricesForItem: vi.fn(),
  calcAverage: vi.fn(),
}));

import { POST } from "@/app/api/update-prices/route";
import { readCollection, writeCollection } from "@/app/lib/collection";
import { revalidatePath } from "next/cache";
import { crawlPricesForItem, calcAverage } from "@/app/lib/priceCrawler";

const mockReadCollection = vi.mocked(readCollection);
const mockWriteCollection = vi.mocked(writeCollection);
const mockRevalidatePath = vi.mocked(revalidatePath);
const mockCrawl = vi.mocked(crawlPricesForItem);
const mockCalcAverage = vi.mocked(calcAverage);

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

const testSource: PriceSource = {
  name: "Test",
  buildUrl: () => "https://test.com",
  priceRegex: /(\d+)/g,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSources.splice(0);
  mockWriteCollection.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Guard: no sources configured
// ---------------------------------------------------------------------------

describe("when PRICE_SOURCES is empty", () => {
  it("returns 400 with a descriptive error", async () => {
    const res = await POST();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/No price sources configured/i);
  });

  it("does not read the collection", async () => {
    await POST();
    expect(mockReadCollection).not.toHaveBeenCalled();
  });

  it("does not write the collection", async () => {
    await POST();
    expect(mockWriteCollection).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("when PRICE_SOURCES has entries", () => {
  beforeEach(() => {
    mockSources.push(testSource);
  });

  it("returns 200 on success", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });
    const res = await POST();
    expect(res.status).toBe(200);
  });

  it("returns { updated, total } in the response body", async () => {
    mockReadCollection.mockResolvedValue({ items: [baseItem] });
    mockCrawl.mockResolvedValue([25, 30]);
    mockCalcAverage.mockReturnValue(27.5);

    const res = await POST();
    const body = await res.json();
    expect(body.updated).toBe(1);
    expect(body.total).toBe(1);
  });

  it("calls crawlPricesForItem once per collection item", async () => {
    const item2 = { ...baseItem, id: "2" };
    mockReadCollection.mockResolvedValue({ items: [baseItem, item2] });
    mockCrawl.mockResolvedValue([10]);
    mockCalcAverage.mockReturnValue(10);

    await POST();

    expect(mockCrawl).toHaveBeenCalledTimes(2);
    expect(mockCrawl).toHaveBeenCalledWith(expect.objectContaining({ id: "1" }));
    expect(mockCrawl).toHaveBeenCalledWith(expect.objectContaining({ id: "2" }));
  });

  it("calls calcAverage with the prices returned by crawlPricesForItem", async () => {
    mockReadCollection.mockResolvedValue({ items: [baseItem] });
    mockCrawl.mockResolvedValue([10, 20, 30]);
    mockCalcAverage.mockReturnValue(20);

    await POST();

    expect(mockCalcAverage).toHaveBeenCalledWith([10, 20, 30]);
  });

  it("calls writeCollection exactly once after all items are processed", async () => {
    const item2 = { ...baseItem, id: "2" };
    mockReadCollection.mockResolvedValue({ items: [baseItem, item2] });
    mockCrawl.mockResolvedValue([10]);
    mockCalcAverage.mockReturnValue(10);

    await POST();

    expect(mockWriteCollection).toHaveBeenCalledOnce();
  });

  it("calls revalidatePath('/')", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });

    await POST();

    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });
});

// ---------------------------------------------------------------------------
// priceAverage mutation — new entry
// ---------------------------------------------------------------------------

describe("adding a new price entry", () => {
  beforeEach(() => mockSources.push(testSource));

  it("pushes a new entry when priceAverage is empty", async () => {
    const today = new Date().toISOString().split("T")[0];
    mockReadCollection.mockResolvedValue({ items: [{ ...baseItem, priceAverage: [] }] });
    mockCrawl.mockResolvedValue([30]);
    mockCalcAverage.mockReturnValue(30);

    await POST();

    const written = mockWriteCollection.mock.calls[0][0];
    expect(written.items[0].priceAverage).toHaveLength(1);
    expect(written.items[0].priceAverage[0]).toEqual({ date: today, price: "30.00 PLN" });
  });

  it("appends a new entry while preserving historical entries from other dates", async () => {
    const today = new Date().toISOString().split("T")[0];
    const oldEntry = { date: "2025-01-01", price: "10.00 PLN" };
    mockReadCollection.mockResolvedValue({
      items: [{ ...baseItem, priceAverage: [oldEntry] }],
    });
    mockCrawl.mockResolvedValue([50]);
    mockCalcAverage.mockReturnValue(50);

    await POST();

    const written = mockWriteCollection.mock.calls[0][0];
    expect(written.items[0].priceAverage).toHaveLength(2);
    expect(written.items[0].priceAverage[0]).toEqual(oldEntry);
    expect(written.items[0].priceAverage[1]).toMatchObject({ date: today, price: "50.00 PLN" });
  });

  it("formats the price with exactly 2 decimal places and ' PLN' suffix", async () => {
    const today = new Date().toISOString().split("T")[0];
    mockReadCollection.mockResolvedValue({ items: [{ ...baseItem, priceAverage: [] }] });
    mockCrawl.mockResolvedValue([23.5]);
    mockCalcAverage.mockReturnValue(23.5);

    await POST();

    const written = mockWriteCollection.mock.calls[0][0];
    expect(written.items[0].priceAverage[0]).toEqual({ date: today, price: "23.50 PLN" });
  });
});

// ---------------------------------------------------------------------------
// priceAverage mutation — replace existing entry for same date
// ---------------------------------------------------------------------------

describe("replacing an existing entry for the same date", () => {
  beforeEach(() => mockSources.push(testSource));

  it("replaces the entry that matches today's date", async () => {
    const today = new Date().toISOString().split("T")[0];
    const staleEntry = { date: today, price: "10.00 PLN" };
    mockReadCollection.mockResolvedValue({
      items: [{ ...baseItem, priceAverage: [staleEntry] }],
    });
    mockCrawl.mockResolvedValue([50]);
    mockCalcAverage.mockReturnValue(50);

    await POST();

    const written = mockWriteCollection.mock.calls[0][0];
    expect(written.items[0].priceAverage).toHaveLength(1);
    expect(written.items[0].priceAverage[0].price).toBe("50.00 PLN");
  });

  it("keeps historical entries unchanged when replacing today's entry", async () => {
    const today = new Date().toISOString().split("T")[0];
    const historical = { date: "2025-06-01", price: "5.00 PLN" };
    const staleToday = { date: today, price: "10.00 PLN" };
    mockReadCollection.mockResolvedValue({
      items: [{ ...baseItem, priceAverage: [historical, staleToday] }],
    });
    mockCrawl.mockResolvedValue([99]);
    mockCalcAverage.mockReturnValue(99);

    await POST();

    const written = mockWriteCollection.mock.calls[0][0];
    expect(written.items[0].priceAverage).toHaveLength(2);
    expect(written.items[0].priceAverage[0]).toEqual(historical);
    expect(written.items[0].priceAverage[1].price).toBe("99.00 PLN");
  });
});

// ---------------------------------------------------------------------------
// Items with no prices found
// ---------------------------------------------------------------------------

describe("when crawlPricesForItem returns empty", () => {
  beforeEach(() => mockSources.push(testSource));

  it("does not modify priceAverage for that item", async () => {
    const existingEntry = { date: "2025-01-01", price: "10.00 PLN" };
    mockReadCollection.mockResolvedValue({
      items: [{ ...baseItem, priceAverage: [existingEntry] }],
    });
    mockCrawl.mockResolvedValue([]);

    await POST();

    const written = mockWriteCollection.mock.calls[0][0];
    expect(written.items[0].priceAverage).toHaveLength(1);
    expect(written.items[0].priceAverage[0]).toEqual(existingEntry);
  });

  it("does not call calcAverage when no prices are found", async () => {
    mockReadCollection.mockResolvedValue({ items: [baseItem] });
    mockCrawl.mockResolvedValue([]);

    await POST();

    expect(mockCalcAverage).not.toHaveBeenCalled();
  });

  it("reports updated=0 when no item has prices", async () => {
    mockReadCollection.mockResolvedValue({ items: [baseItem] });
    mockCrawl.mockResolvedValue([]);

    const res = await POST();
    const body = await res.json();
    expect(body.updated).toBe(0);
    expect(body.total).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Mixed: some items updated, some not
// ---------------------------------------------------------------------------

describe("mixed collection — some items have prices, some do not", () => {
  beforeEach(() => mockSources.push(testSource));

  it("updates only items that return prices", async () => {
    const item2 = { ...baseItem, id: "2", priceAverage: [] };
    mockReadCollection.mockResolvedValue({ items: [baseItem, item2] });
    mockCrawl
      .mockResolvedValueOnce([20]) // item 1: prices found
      .mockResolvedValueOnce([]); // item 2: no prices
    mockCalcAverage.mockReturnValue(20);

    const res = await POST();
    const body = await res.json();

    expect(body.updated).toBe(1);
    expect(body.total).toBe(2);
  });

  it("writes all items regardless of whether they were updated", async () => {
    const item2 = { ...baseItem, id: "2" };
    mockReadCollection.mockResolvedValue({ items: [baseItem, item2] });
    mockCrawl
      .mockResolvedValueOnce([20])
      .mockResolvedValueOnce([]);
    mockCalcAverage.mockReturnValue(20);

    await POST();

    const written = mockWriteCollection.mock.calls[0][0];
    expect(written.items).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Empty collection
// ---------------------------------------------------------------------------

describe("empty collection", () => {
  beforeEach(() => mockSources.push(testSource));

  it("returns updated=0 and total=0", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });

    const res = await POST();
    const body = await res.json();
    expect(body.updated).toBe(0);
    expect(body.total).toBe(0);
  });

  it("still calls writeCollection and revalidatePath", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });

    await POST();

    expect(mockWriteCollection).toHaveBeenCalledOnce();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });
});
