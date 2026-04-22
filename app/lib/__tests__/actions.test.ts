import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CollectionItem } from "@/app/lib/collection";

vi.mock("@/app/lib/collection", () => ({
  readCollection: vi.fn(),
  writeCollection: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { addCollectionItem, deleteCollectionItem, updateCollectionItem } from "@/app/lib/actions";
import { readCollection, writeCollection } from "@/app/lib/collection";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const mockReadCollection = vi.mocked(readCollection);
const mockWriteCollection = vi.mocked(writeCollection);
const mockRevalidatePath = vi.mocked(revalidatePath);
const mockRedirect = vi.mocked(redirect);

const existingItem: CollectionItem = {
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
  priceAverage: "",
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
  priceAverage: "",
  openWindow: false,
  bigWing: false,
  frontBoltPositionOnEdge: false,
  backBoltPositionOnEdge: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockWriteCollection.mockResolvedValue(undefined);
});

describe("addCollectionItem", () => {
  it("returns a new item with a generated id", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });

    const input = { ...baseInput, modelName: "Land Rover Defender 90", releaseYear: 2023 };
    const result = await addCollectionItem(input);

    expect(result).toMatchObject(input);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
  });

  it("appends the new item to existing items", async () => {
    mockReadCollection.mockResolvedValue({ items: [existingItem] });

    await addCollectionItem({ ...baseInput, modelName: "New Car", releaseYear: 2024 });

    const writtenData = mockWriteCollection.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(2);
    expect(writtenData.items[0]).toEqual(existingItem);
    expect(writtenData.items[1].modelName).toBe("New Car");
  });

  it("calls revalidatePath('/')", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });

    await addCollectionItem({ ...baseInput, modelName: "Car", releaseYear: 2024 });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("works when adding to an empty collection", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });

    const result = await addCollectionItem({ ...baseInput, modelName: "First Car", releaseYear: 1968 });

    const writtenData = mockWriteCollection.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(1);
    expect(writtenData.items[0]).toEqual(result);
  });
});

describe("deleteCollectionItem", () => {
  it("removes the item with the given id", async () => {
    const other: CollectionItem = { ...existingItem, id: "222", modelName: "Other" };
    mockReadCollection.mockResolvedValue({ items: [existingItem, other] });

    await deleteCollectionItem("111");

    const writtenData = mockWriteCollection.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(1);
    expect(writtenData.items[0].id).toBe("222");
  });

  it("calls revalidatePath('/') and redirect('/')", async () => {
    mockReadCollection.mockResolvedValue({ items: [existingItem] });

    await deleteCollectionItem("111");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
    expect(mockRedirect).toHaveBeenCalledWith("/");
  });

  it("does not throw when id does not exist", async () => {
    mockReadCollection.mockResolvedValue({ items: [existingItem] });

    await expect(deleteCollectionItem("nonexistent")).resolves.toBeUndefined();

    const writtenData = mockWriteCollection.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(1);
  });

  it("empties the collection when deleting the only item", async () => {
    mockReadCollection.mockResolvedValue({ items: [existingItem] });

    await deleteCollectionItem("111");

    const writtenData = mockWriteCollection.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(0);
  });
});

describe("updateCollectionItem", () => {
  it("returns the updated item with the same id", async () => {
    mockReadCollection.mockResolvedValue({ items: [existingItem] });

    const updates = { ...baseInput, modelName: "Updated Name", releaseYear: 2025 };
    const result = await updateCollectionItem("111", updates);

    expect(result).toEqual({ id: "111", ...updates });
  });

  it("updates the item in place, preserving order", async () => {
    const other: CollectionItem = { ...existingItem, id: "222", modelName: "Other" };
    mockReadCollection.mockResolvedValue({ items: [existingItem, other] });

    const updates = { ...baseInput, modelName: "Updated", releaseYear: 2025 };
    await updateCollectionItem("111", updates);

    const writtenData = mockWriteCollection.mock.calls[0][0];
    expect(writtenData.items).toHaveLength(2);
    expect(writtenData.items[0]).toEqual({ id: "111", ...updates });
    expect(writtenData.items[1]).toEqual(other);
  });

  it("calls revalidatePath('/')", async () => {
    mockReadCollection.mockResolvedValue({ items: [existingItem] });

    await updateCollectionItem("111", { ...baseInput, modelName: "Car", releaseYear: 2024 });

    expect(mockRevalidatePath).toHaveBeenCalledWith("/");
  });

  it("throws when id is not found", async () => {
    mockReadCollection.mockResolvedValue({ items: [existingItem] });

    await expect(
      updateCollectionItem("nonexistent", { ...baseInput, modelName: "Car", releaseYear: 2024 })
    ).rejects.toThrow("Item not found: nonexistent");
  });
});
