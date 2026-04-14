import Link from "next/link";
import { readCollection } from "@/app/lib/collection";

export default async function List({
  selectedId,
  searchQuery,
}: {
  selectedId?: string;
  searchQuery?: string;
}) {
  const { items } = await readCollection();

  const filtered = searchQuery
    ? items.filter((item) =>
        item.modelName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <div className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
      {filtered.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {searchQuery ? "No results." : "No models yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {filtered.map((item) => (
            <li key={item.id}>
              <Link
                href={`/?selected=${item.id}`}
                className={`block rounded px-3 py-2 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                  selectedId === item.id
                    ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {item.modelName}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
