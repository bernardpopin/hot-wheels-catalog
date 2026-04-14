import { readFile, writeFile } from "fs/promises";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "collection.json");

export type CollectionItem = {
  id: string;
  modelName: string;
  carBrand: string;
  carModel: string;
  carProductionYear: number | null;
  releaseYear: number;
  yearOnChassis: number | null;
  series: string;
  color: string;
  modelNumber: string;
  priceRange: string;
  openWindow: boolean;
  bigWing: boolean;
  frontBoltPositionOnEdge: boolean;
  backBoltPositionOnEdge: boolean;
};

type CollectionData = {
  items: CollectionItem[];
};

export async function readCollection(): Promise<CollectionData> {
  const raw = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(raw) as CollectionData;
}

export async function writeCollection(data: CollectionData): Promise<void> {
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}
