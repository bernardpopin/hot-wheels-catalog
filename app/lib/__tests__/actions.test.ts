import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CatalogItem } from "@/app/lib/catalog";

vi.mock("@/app/lib/catalog", () => ({
  readCatalog: vi.fn(),
  writeCatalog: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { addCatalogItem, deleteCatalogItem } from "@/app/lib/actions";
import { readCatalog, writeCatalog } from "@/app/lib/catalog";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const mockReadCatalog = vi.mocked(readCatalog);
const mockWriteCatalog = vi.mocked(writeCatalog);
const mockRevalidatePath = vi.mocked(revalidatePath);
const mockRedirect = vi.mocked(redirect);

const existingItem: CatalogItem = {
  id: "111",
  model: "Datsun 240Z Custom",
  year: 2021,
  openWindow: true,
  bigWing: false,
  frontBoltPositionOnEdge: true,
  backBoltPositionOnEdge: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockWriteCatalog.mockResolvedValue(undefined);
});

describe("addCatalogItem", () => {
  it("returns a new item with a generated id", async () => {
    mockReadCatalog.mockResolvedValue({ items: [] });

    const input = {
      model: "Land Rover Defender 90",
      year: 2023,
      openWindow: false,
      bigWing: false,
      frontBoltPositionOnEdge: false,
      backBoltPositionOnEdge: false,
    };

    const result = await addCatalogItem(input);

    expect(result).toMatchObject(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
  });

  it("appends the new item to existing items", async () => {
    mockReadCatalog.mockResolvedValue({ items: [existingItem] });

    await addCatalogItem({
      model: "New Car",
      year: 2024,
      openWindow: false,
      bigWing: false,
      frontBoltPositionOnEdge: false,
      backBoltPositionOnEdge: false,
    });

    const writtenData = mockWriteCatalog.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(2);
    expect(writtenData.items[0]).toEqual(existingItem);
    expect(writtenData.items[1].model).toBe("New Car");
  });

  it("calls revalidatePath('/')", async () => {
    mockReadCatalog.mockResolvedValue({ items: [] });

    await addCatalogItem({
      model: "Car",
      year: 2024,
      openWindow: false,
      bigWing: false,
      frontBoltPositionOnEdge: false,
      backBoltPositionOnEdge: false,
    });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("works when adding to an empty catalog", async () => {
    mockReadCatalog.mockResolvedValue({ items: [] });

    const result = await addCatalogItem({
      model: "First Car",
      year: 1968,
      openWindow: false,
      bigWing: false,
      frontBoltPositionOnEdge: false,
      backBoltPositionOnEdge: false,
    });

    const writtenData = mockWriteCatalog.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(1);
    expect(writtenData.items[0]).toEqual(result);
  });
});

describe("deleteCatalogItem", () => {
  it("removes the item with the given id", async () => {
    const other: CatalogItem = { ...existingItem, id: "222", model: "Other" };
    mockReadCatalog.mockResolvedValue({ items: [existingItem, other] });

    await deleteCatalogItem("111");

    const writtenData = mockWriteCatalog.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(1);
    expect(writtenData.items[0].id).toBe("222");
  });

  it("calls revalidatePath('/') and redirect('/')", async () => {
    mockReadCatalog.mockResolvedValue({ items: [existingItem] });

    await deleteCatalogItem("111");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("does not throw when id does not exist", async () => {
    mockReadCatalog.mockResolvedValue({ items: [existingItem] });

    await expect(deleteCatalogItem("nonexistent")).resolves.toBeUndefined();

    const writtenData = mockWriteCatalog.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(1);
  });

  it("empties the catalog when deleting the only item", async () => {
    mockReadCatalog.mockResolvedValue({ items: [existingItem] });

    await deleteCatalogItem("111");

    const writtenData = mockWriteCatalog.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(0);
  });
});
