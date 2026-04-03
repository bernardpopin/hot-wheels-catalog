import type { CatalogItem } from "@/app/lib/catalog";
import { deleteCatalogItem } from "@/app/lib/actions";
import RemoveButton from "@/app/components/RemoveButton";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-3 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
    </div>
  );
}

export default function ModelDetail({ item }: { item: CatalogItem }) {
  const deleteItem = deleteCatalogItem.bind(null, item.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          {item.model}
        </h2>
        <RemoveButton action={deleteItem} />
      </div>
      <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
        <Row label="Year" value={String(item.year)} />
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
