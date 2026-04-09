import { describe, it, expect, vi, beforeEach } from "vitest";
import type { CatalogItem } from "@/app/lib/catalog";

// vi.hoisted ensures these vi.fn() instances are created before vi.mock hoisting
const { mockReadFile, mockWriteFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
  mockWriteFile: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  // Named exports used by catalog.ts
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  // Default export for ESM interop
  default: { readFile: mockReadFile, writeFile: mockWriteFile },
}));

import { readCatalog, writeCatalog } from "@/app/lib/catalog";

const item1: CatalogItem = {
  id: "1",
  model: "Datsun 240Z Custom",
  year: 2021,
  openWindow: true,
  bigWing: false,
  frontBoltPositionOnEdge: true,
  backBoltPositionOnEdge: false,
};

const item2: CatalogItem = {
  id: "2",
  model: "90' Acura NSX",
  year: 2022,
  openWindow: false,
  bigWing: true,
  frontBoltPositionOnEdge: false,
  backBoltPositionOnEdge: true,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("readCatalog", () => {
  it("returns parsed catalog data", async () => {
    const data = { items: [item1, item2] };
    mockReadFile.mockResolvedValue(JSON.stringify(data));

    const result = await readCatalog();

    expect(result).toEqual(data);
  });

  it("returns empty items array when catalog is empty", async () => {
    mockReadFile.mockResolvedValue(JSON.stringify({ items: [] }));

    const result = await readCatalog();

    expect(result.items).toHaveLength(0);
  });

  it("throws when the file does not exist", async () => {
    mockReadFile.mockRejectedValue(
      Object.assign(new Error("ENOENT"), { code: "ENOENT" })
    );

    await expect(readCatalog()).rejects.toThrow("ENOENT");
  });

  it("throws when the file contains invalid JSON", async () => {
    mockReadFile.mockResolvedValue("not json");

    await expect(readCatalog()).rejects.toThrow(SyntaxError);
  });
});

describe("writeCatalog", () => {
  it("writes JSON with 2-space indentation", async () => {
    mockWriteFile.mockResolvedValue(undefined);
    const data = { items: [item1] };

    await writeCatalog(data);

    expect(mockWriteFile).toHaveBeenCalledOnce();
    const [, content, encoding] = mockWriteFile.mock.calls[0];
    expect(content).toBe(JSON.stringify(data, null, 2));
    expect(encoding).toBe("utf-8");
  });

  it("writes an empty items array", async () => {
    mockWriteFile.mockResolvedValue(undefined);

    await writeCatalog({ items: [] });

    const [, content] = mockWriteFile.mock.calls[0];
    expect(JSON.parse(content as string)).toEqual({ items: [] });
  });

  it("throws when writeFile fails", async () => {
    mockWriteFile.mockRejectedValue(new Error("disk full"));

    await expect(writeCatalog({ items: [item1] })).rejects.toThrow("disk full");
  });

  it("round-trips: write then read returns the same data", async () => {
    const data = { items: [item1, item2] };
    let stored = "";

    mockWriteFile.mockImplementation(async (_, content) => {
      stored = content as string;
    });
    mockReadFile.mockImplementation(async () => stored);

    await writeCatalog(data);
    const result = await readCatalog();

    expect(result).toEqual(data);
  });
});
