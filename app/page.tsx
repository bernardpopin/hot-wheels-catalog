import { Suspense } from "react";
import TopBar from "@/app/components/TopBar";
import List from "@/app/components/List";
import Search from "@/app/components/Search";
import AddForm from "@/app/components/AddForm";
import DetailPanel from "@/app/components/DetailPanel";
import AgentChat from "@/app/components/AgentChat";
import { readCollection } from "@/app/lib/collection";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string; q?: string; assistant?: string }>;
}) {
  const { selected, q, assistant } = await searchParams;

  const { items } = await readCollection();
  const selectedItem = selected
    ? (items.find((item) => item.id === selected) ?? null)
    : null;

  function renderPanel() {
    if (assistant === "true") return <AgentChat />;
    if (selectedItem) return <DetailPanel item={selectedItem} />;
    return <AddForm />;
  }

  return (
    <>
      <TopBar />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex gap-8">
          <aside className="flex w-56 shrink-0 flex-col gap-3">
            <Suspense>
              <Search />
            </Suspense>
            <List selectedId={selected} searchQuery={q} />
          </aside>
          <div className="flex-1">{renderPanel()}</div>
        </div>
      </main>
    </>
  );
}
