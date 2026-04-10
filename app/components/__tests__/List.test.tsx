import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { CatalogItem } from "@/app/lib/catalog";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/lib/catalog", () => ({
  readCatalog: vi.fn(),
}));

import List from "@/app/components/List";
import { readCatalog } from "@/app/lib/catalog";

const mockReadCatalog = vi.mocked(readCatalog);

const item1: CatalogItem = {
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
  priceRange: "",
  openWindow: true,
  bigWing: false,
  frontBoltPositionOnEdge: true,
  backBoltPositionOnEdge: false,
};

const item2: CatalogItem = {
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
  priceRange: "",
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
    mockReadCatalog.mockResolvedValue({ items: [item1, item2] });

    await renderList({});

    expect(screen.getByText("Datsun 240Z Custom")).toBeInTheDocument();
    expect(screen.getByText("90' Acura NSX")).toBeInTheDocument();
  });

  it("each item links to /?selected=<id>", async () => {
    mockReadCatalog.mockResolvedValue({ items: [item1] });

    await renderList({});

    const link = screen.getByRole("link", { name: "Datsun 240Z Custom" });
    expect(link).toHaveAttribute("href", "/?selected=1");
  });

  it("shows 'No models yet.' when catalog is empty and no query", async () => {
    mockReadCatalog.mockResolvedValue({ items: [] });

    await renderList({});

    expect(screen.getByText("No models yet.")).toBeInTheDocument();
  });

  it("filters items by searchQuery (case-insensitive)", async () => {
    mockReadCatalog.mockResolvedValue({ items: [item1, item2] });

    await renderList({ searchQuery: "datsun" });

    expect(screen.getByText("Datsun 240Z Custom")).toBeInTheDocument();
    expect(screen.queryByText("90' Acura NSX")).not.toBeInTheDocument();
  });

  it("shows 'No results.' when search matches nothing", async () => {
    mockReadCatalog.mockResolvedValue({ items: [item1, item2] });

    await renderList({ searchQuery: "ferrari" });

    expect(screen.getByText("No results.")).toBeInTheDocument();
  });

  it("highlights the selected item", async () => {
    mockReadCatalog.mockResolvedValue({ items: [item1, item2] });

    await renderList({ selectedId: "1" });

    const selectedLink = screen.getByRole("link", { name: "Datsun 240Z Custom" });
    expect(selectedLink.className).toContain("font-medium");
  });

  it("does not highlight unselected items", async () => {
    mockReadCatalog.mockResolvedValue({ items: [item1, item2] });

    await renderList({ selectedId: "1" });

    const unselectedLink = screen.getByRole("link", { name: "90' Acura NSX" });
    expect(unselectedLink.className).not.toContain("font-medium");
  });

  it("shows all items when searchQuery is an empty string", async () => {
    mockReadCatalog.mockResolvedValue({ items: [item1, item2] });

    await renderList({ searchQuery: "" });

    expect(screen.getByText("Datsun 240Z Custom")).toBeInTheDocument();
    expect(screen.getByText("90' Acura NSX")).toBeInTheDocument();
  });
});
