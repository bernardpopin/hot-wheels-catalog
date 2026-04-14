"use client";

import type { CollectionItem } from "@/app/lib/collection";
import { deleteCollectionItem } from "@/app/lib/actions";
import RemoveButton from "@/app/components/RemoveButton";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

export default function ModelDetail({
  item,
  onEdit,
}: {
  item: CollectionItem;
  onEdit: () => void;
}) {
  const deleteItem = deleteCollectionItem.bind(null, item.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {item.modelName}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
          >
            Edit
          </button>
          <RemoveButton action={deleteItem} />
        </div>
      </div>
      <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
        <Row label="Car brand" value={item.carBrand || "—"} />
        <Row label="Car model" value={item.carModel || "—"} />
        <Row
          label="Year of production of the car"
          value={item.carProductionYear != null ? String(item.carProductionYear) : "—"}
        />
        <Row label="Release year" value={String(item.releaseYear)} />
        <Row
          label="Year on chassis"
          value={item.yearOnChassis != null ? String(item.yearOnChassis) : "—"}
        />
        <Row label="Series" value={item.series || "—"} />
        <Row label="Color" value={item.color || "—"} />
        <Row label="Model number" value={item.modelNumber || "—"} />
        <Row label="Price range" value={item.priceRange || "—"} />
        <Row label="Open window" value={item.openWindow ? "Yes" : "No"} />
        <Row label="Big wing" value={item.bigWing ? "Yes" : "No"} />
        <Row
          label="Front bolt position on edge"
          value={item.frontBoltPositionOnEdge ? "Yes" : "No"}
        />
        <Row
          label="Back bolt position on edge"
          value={item.backBoltPositionOnEdge ? "Yes" : "No"}
        />
      </dl>
    </div>
  );
}
