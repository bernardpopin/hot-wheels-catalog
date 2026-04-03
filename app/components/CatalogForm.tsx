"use client";

import { useState } from "react";
import { addCatalogItem } from "@/app/lib/actions";
import type { CatalogItem } from "@/app/lib/catalog";

type FormState = Omit<CatalogItem, "id">;

const initialState: FormState = {
  model: "",
  year: new Date().getFullYear(),
  openWindow: false,
  bigWing: false,
  frontBoltPositionOnEdge: false,
  backBoltPositionOnEdge: false,
};

export default function CatalogForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [saving, setSaving] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await addCatalogItem(form);
    setForm(initialState);
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Model
        </label>
        <input
          type="text"
          name="model"
          value={form.model}
          onChange={handleChange}
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Year
        </label>
        <input
          type="number"
          name="year"
          value={form.year}
          onChange={handleChange}
          required
          min={1968}
          max={2100}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400"
        />
      </div>

      <div className="flex flex-col gap-3">
        {(
          [
            { name: "openWindow", label: "Open window" },
            { name: "bigWing", label: "Big wing" },
            { name: "frontBoltPositionOnEdge", label: "Front bolt position on edge" },
            { name: "backBoltPositionOnEdge", label: "Back bolt position on edge" },
          ] as { name: keyof FormState; label: string }[]
        ).map(({ name, label }) => (
          <label key={name} className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name={name}
              checked={form[name] as boolean}
              onChange={handleChange}
              className="h-4 w-4 rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-100"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {label}
            </span>
          </label>
        ))}
      </div>

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
