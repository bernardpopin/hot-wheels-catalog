"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCatalogItem } from "@/app/lib/actions";
import { useItemForm } from "@/app/components/useItemForm";
import ItemFormFields from "@/app/components/ItemFormFields";
import type { CatalogItem } from "@/app/lib/catalog";

export default function EditForm({
  item,
  onDone,
}: {
  item: CatalogItem;
  onDone: () => void;
}) {
  const router = useRouter();
  const { id, ...rest } = item;
  const { form, handleChange } = useItemForm(rest);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await updateCatalogItem(id, form);
    router.refresh();
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <ItemFormFields form={form} onChange={handleChange} />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onDone}
          className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-zinc-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
