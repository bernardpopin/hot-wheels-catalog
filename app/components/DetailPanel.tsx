"use client";

import { useState } from "react";
import type { CollectionItem } from "@/app/lib/collection";
import ModelDetail from "@/app/components/ModelDetail";
import EditForm from "@/app/components/EditForm";

export default function DetailPanel({ item }: { item: CollectionItem }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return <EditForm item={item} onDone={() => setEditing(false)} />;
  }

  return <ModelDetail item={item} onEdit={() => setEditing(true)} />;
}
