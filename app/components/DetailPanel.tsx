"use client";

import { useState } from "react";
import type { CatalogItem } from "@/app/lib/catalog";
import ModelDetail from "@/app/components/ModelDetail";
import EditForm from "@/app/components/EditForm";

export default function DetailPanel({ item }: { item: CatalogItem }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditForm item={item} onDone={() => setEditing(false)} />;
  }

  return <ModelDetail item={item} onEdit={() => setEditing(true)} />;
}
