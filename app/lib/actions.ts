"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { readCollection, writeCollection } from "@/app/lib/collection";
import type { CollectionItem } from "@/app/lib/collection";

export async function addCollectionItem(
  item: Omit<CollectionItem, "id">
): Promise<CollectionItem> {
  const data = await readCollection();

  const newItem: CollectionItem = {
    id: Date.now().toString(),
    ...item,
  };

  data.items.push(newItem);
  await writeCollection(data);
  revalidatePath("/");

  return newItem;
}

export async function deleteCollectionItem(id: string): Promise<void> {
  const data = await readCollection();
  data.items = data.items.filter((item) => item.id !== id);
  await writeCollection(data);
  revalidatePath("/");
  redirect("/");
}

export async function updateCollectionItem(
  id: string,
  item: Omit<CollectionItem, "id">
): Promise<CollectionItem> {
  const data = await readCollection();
  const index = data.items.findIndex((i) => i.id === id);
  if (index === -1) throw new Error(`Item not found: ${id}`);
  const updated = { id, ...item };
  data.items[index] = updated;
  await writeCollection(data);
  revalidatePath("/");
  return updated;
}
