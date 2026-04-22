import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CollectionItem } from "@/app/lib/collection";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/lib/collection", () => ({
  readCollection: vi.fn(),
}));

import List from "@/app/components/List";
import { readCollection } from "@/app/lib/collection";

const mockReadCollection = vi.mocked(readCollection);

const item1: CollectionItem = {
  id: "1",
  modelName: "Datsun 240Z Custom",
  carBrand: "Nissan",
  carModel: "240Z",
  carProductionYear: 1969,
  releaseYear: 2021,
  yearOnChassis: null,
  series: "",
  color: "",
  modelNumber: "",
  priceAverage: [],
  openWindow: true,
  bigWing: false,
  frontBoltPositionOnEdge: true,
  backBoltPositionOnEdge: false,
};

const item2: CollectionItem = {
  id: "2",
  modelName: "90' Acura NSX",
  carBrand: "Acura",
  carModel: "NSX",
  carProductionYear: 1990,
  releaseYear: 2022,
  yearOnChassis: null,
  series: "",
  color: "",
  modelNumber: "",
  priceAverage: [],
  openWindow: false,
  bigWing: true,
  frontBoltPositionOnEdge: false,
  backBoltPositionOnEdge: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

async function renderList(props: { selectedId?: string; searchQuery?: string }) {
  const jsx = await List(props);
  return render(jsx);
}

describe("List", () => {
  it("renders all items when no search query", async () => {
    mockReadCollection.mockResolvedValue({ items: [item1, item2] });

    await renderList({});

    expect(screen.getByText("Datsun 240Z Custom")).toBeInTheDocument();
    expect(screen.getByText("90' Acura NSX")).toBeInTheDocument();
  });

  it("each item links to /?selected=<id>", async () => {
    mockReadCollection.mockResolvedValue({ items: [item1] });

    await renderList({});

    const link = screen.getByRole("link", { name: "Datsun 240Z Custom" });
    expect(link).toHaveAttribute("href", "/?selected=1");
  });

  it("shows 'No models yet.' when collection is empty and no query", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });

    await renderList({});

    expect(screen.getByText("No models yet.")).toBeInTheDocument();
  });

  it("filters items by searchQuery (case-insensitive)", async () => {
    mockReadCollection.mockResolvedValue({ items: [item1, item2] });

    await renderList({ searchQuery: "datsun" });

    expect(screen.getByText("Datsun 240Z Custom")).toBeInTheDocument();
    expect(screen.queryByText("90' Acura NSX")).not.toBeInTheDocument();
  });

  it("shows 'No results.' when search matches nothing", async () => {
    mockReadCollection.mockResolvedValue({ items: [item1, item2] });

    await renderList({ searchQuery: "ferrari" });

    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("highlights the selected item", async () => {
    mockReadCollection.mockResolvedValue({ items: [item1, item2] });

    await renderList({ selectedId: "1" });

    const selectedLink = screen.getByRole("link", { name: "Datsun 240Z Custom" });
    expect(selectedLink.className).toContain("font-medium");
  });

  it("does not highlight unselected items", async () => {
    mockReadCollection.mockResolvedValue({ items: [item1, item2] });

    await renderList({ selectedId: "1" });

    const unselectedLink = screen.getByRole("link", { name: "90' Acura NSX" });
    expect(unselectedLink.className).not.toContain("font-medium");
  });

  it("shows all items when searchQuery is an empty string", async () => {
    mockReadCollection.mockResolvedValue({ items: [item1, item2] });

    await renderList({ searchQuery: "" });

    expect(screen.getByText("Datsun 240Z Custom")).toBeInTheDocument();
    expect(screen.getByText("90' Acura NSX")).toBeInTheDocument();
  });
});
