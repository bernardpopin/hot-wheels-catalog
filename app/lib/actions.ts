"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { readCatalog, writeCatalog } from "@/app/lib/catalog";
import type { CatalogItem } from "@/app/lib/catalog";

export async function addCatalogItem(
  item: Omit<CatalogItem, "id">
): Promise<CatalogItem> {
  const data = await readCatalog();

  const newItem: CatalogItem = {
    id: Date.now().toString(),
    ...item,
  };

  data.items.push(newItem);
  await writeCatalog(data);
  revalidatePath("/");

  return newItem;
}

export async function deleteCatalogItem(id: string): Promise<void> {
  const data = await readCatalog();
  data.items = data.items.filter((item) => item.id !== id);
  await writeCatalog(data);
  revalidatePath("/");
  redirect("/");
}

export async function updateCatalogItem(
  id: string,
  item: Omit<CatalogItem, "id">
): Promise<CatalogItem> {
  const data = await readCatalog();
  const index = data.items.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(`Item not found: ${id}`);
  const updated = { id, ...item };
  data.items[index] = updated;
  await writeCatalog(data);
  revalidatePath("/");
  return updated;
}
