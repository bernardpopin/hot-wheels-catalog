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

import { addCatalogItem, deleteCatalogItem, updateCatalogItem } from "@/app/lib/actions";
import { readCatalog, writeCatalog } from "@/app/lib/catalog";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const mockReadCatalog = vi.mocked(readCatalog);
const mockWriteCatalog = vi.mocked(writeCatalog);
const mockRevalidatePath = vi.mocked(revalidatePath);
const mockRedirect = vi.mocked(redirect);

const existingItem: CatalogItem = {
  id: "111",
  modelName: "Datsun 240Z Custom",
  carBrand: "Nissan",
  carModel: "240Z",
  carProductionYear: 1969,
  releaseYear: 2021,
  yearOnChassis: null,
  series: "",
  color: "",
  modelNumber: "",
  priceRange: "",
  openWindow: true,
  bigWing: false,
  frontBoltPositionOnEdge: true,
  backBoltPositionOnEdge: false,
};

const baseInput = {
  carBrand: "",
  carModel: "",
  carProductionYear: null as null,
  yearOnChassis: null as null,
  series: "",
  color: "",
  modelNumber: "",
  priceRange: "",
  openWindow: false,
  bigWing: false,
  frontBoltPositionOnEdge: false,
  backBoltPositionOnEdge: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockWriteCatalog.mockResolvedValue(undefined);
});

describe("addCatalogItem", () => {
  it("returns a new item with a generated id", async () => {
    mockReadCatalog.mockResolvedValue({ items: [] });

    const input = { ...baseInput, modelName: "Land Rover Defender 90", releaseYear: 2023 };
    const result = await addCatalogItem(input);

    expect(result).toMatchObject(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
  });

  it("appends the new item to existing items", async () => {
    mockReadCatalog.mockResolvedValue({ items: [existingItem] });

    await addCatalogItem({ ...baseInput, modelName: "New Car", releaseYear: 2024 });

    const writtenData = mockWriteCatalog.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(2);
    expect(writtenData.items[0]).toEqual(existingItem);
    expect(writtenData.items[1].modelName).toBe("New Car");
  });

  it("calls revalidatePath('/')", async () => {
    mockReadCatalog.mockResolvedValue({ items: [] });

    await addCatalogItem({ ...baseInput, modelName: "Car", releaseYear: 2024 });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("works when adding to an empty catalog", async () => {
    mockReadCatalog.mockResolvedValue({ items: [] });

    const result = await addCatalogItem({ ...baseInput, modelName: "First Car", releaseYear: 1968 });

    const writtenData = mockWriteCatalog.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(1);
    expect(writtenData.items[0]).toEqual(result);
  });
});

describe("deleteCatalogItem", () => {
  it("removes the item with the given id", async () => {
    const other: CatalogItem = { ...existingItem, id: "222", modelName: "Other" };
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

describe("updateCatalogItem", () => {
  it("returns the updated item with the same id", async () => {
    mockReadCatalog.mockResolvedValue({ items: [existingItem] });

    const updates = { ...baseInput, modelName: "Updated Name", releaseYear: 2025 };
    const result = await updateCatalogItem("111", updates);

    expect(result).toEqual({ id: "111", ...updates });
  });

  it("updates the item in place, preserving order", async () => {
    const other: CatalogItem = { ...existingItem, id: "222", modelName: "Other" };
    mockReadCatalog.mockResolvedValue({ items: [existingItem, other] });

    const updates = { ...baseInput, modelName: "Updated", releaseYear: 2025 };
    await updateCatalogItem("111", updates);

    const writtenData = mockWriteCatalog.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(2);
    expect(writtenData.items[0]).toEqual({ id: "111", ...updates });
    expect(writtenData.items[1]).toEqual(other);
  });

  it("calls revalidatePath('/')", async () => {
    mockReadCatalog.mockResolvedValue({ items: [existingItem] });

    await updateCatalogItem("111", { ...baseInput, modelName: "Car", releaseYear: 2024 });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("throws when id is not found", async () => {
    mockReadCatalog.mockResolvedValue({ items: [existingItem] });

    await expect(
      updateCatalogItem("nonexistent", { ...baseInput, modelName: "Car", releaseYear: 2024 })
    ).rejects.toThrow("Item not found: nonexistent");
  });
});
