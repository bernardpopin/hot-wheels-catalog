import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CollectionItem } from "@/app/lib/collection";

vi.mock("@/app/lib/collection", () => ({
  readCollection: vi.fn(),
  writeCollection: vi.fn(),
}));

import { GET, POST } from "@/app/api/collection/route";
import { readCollection, writeCollection } from "@/app/lib/collection";

const mockReadCollection = vi.mocked(readCollection);
const mockWriteCollection = vi.mocked(writeCollection);

const item1: CollectionItem = {
  id: "1",
  modelName: "Datsun 240Z Custom",
  carBrand: "Nissan",
  carModel: "240Z",
  carProductionYear: 1969,
  releaseYear: 2021,
  yearOnChassis: null,
  series: "",
  color: "",
  modelNumber: "",
  priceAverage: [],
  openWindow: true,
  bigWing: false,
  frontBoltPositionOnEdge: true,
  backBoltPositionOnEdge: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockWriteCollection.mockResolvedValue(undefined);
});

describe("GET /api/collection", () => {
  it("returns 200 with collection items", async () => {
    mockReadCollection.mockResolvedValue({ items: [item1] });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ items: [item1] });
  });

  it("returns an empty items array when collection is empty", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });

    const response = await GET();
    const body = await response.json();

    expect(body.items).toHaveLength(0);
  });
});

describe("POST /api/collection", () => {
  const newItemInput = {
    modelName: "Land Rover Defender 90",
    carBrand: "Land Rover",
    carModel: "Defender 90",
    carProductionYear: 1983,
    releaseYear: 2023,
    yearOnChassis: null,
    series: "",
    color: "",
    modelNumber: "",
    priceAverage: [],
    openWindow: false,
    bigWing: false,
    frontBoltPositionOnEdge: false,
    backBoltPositionOnEdge: false,
  };

  function makeRequest(body: unknown) {
    return { json: async () => body } as Request;
  }

  it("returns 201 with the created item", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });

    const response = await POST(makeRequest(newItemInput) as never);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toMatchObject(newItemInput);
    expect(typeof body.id).toBe("string");
  });

  it("persists the new item to the collection", async () => {
    mockReadCollection.mockResolvedValue({ items: [item1] });

    await POST(makeRequest(newItemInput) as never);

    const writtenData = mockWriteCollection.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(2);
    expect(writtenData.items[1]).toMatchObject(newItemInput);
  });

  it("includes all boolean variant fields in the created item", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });

    const input = {
      ...newItemInput,
      openWindow: true,
      bigWing: true,
      frontBoltPositionOnEdge: true,
      backBoltPositionOnEdge: true,
    };

    const response = await POST(makeRequest(input) as never);
    const body = await response.json();

    expect(body.openWindow).toBe(true);
    expect(body.bigWing).toBe(true);
    expect(body.frontBoltPositionOnEdge).toBe(true);
    expect(body.backBoltPositionOnEdge).toBe(true);
  });
});
