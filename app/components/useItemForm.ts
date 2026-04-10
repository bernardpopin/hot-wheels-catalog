import { useState } from "react";
import type { CatalogItem } from "@/app/lib/catalog";

export type FormState = Omit<CatalogItem, "id">;

export function useItemForm(initial: FormState) {
  const [form, setForm] = useState<FormState>(initial);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? value === ""
              ? null
              : Number(value)
            : value,
    }));
  }

  return { form, setForm, handleChange };
}
