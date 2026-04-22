"use client";

import { useState } from "react";
import { addCollectionItem } from "@/app/lib/actions";
import { useItemForm, type FormState } from "@/app/components/useItemForm";
import ItemFormFields from "@/app/components/ItemFormFields";

const initialState: FormState = {
  modelName: "",
  carBrand: "",
  carModel: "",
  carProductionYear: null,
  releaseYear: new Date().getFullYear(),
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

export default function AddForm() {
  const { form, setForm, handleChange } = useItemForm(initialState);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await addCollectionItem(form);
    setForm(initialState);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <ItemFormFields form={form} onChange={handleChange} />
      <div>
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
