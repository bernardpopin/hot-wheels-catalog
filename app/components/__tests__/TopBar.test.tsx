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

vi.mock("@/app/components/PriceUpdateButton", () => ({
  default: () => <button>AI Update prices</button>,
}));

import TopBar from "@/app/components/TopBar";
import { readCollection } from "@/app/lib/collection";

const mockReadCollection = vi.mocked(readCollection);

const baseItem: CollectionItem = {
  id: "1",
  modelName: "Datsun 240Z Custom",
  carBrand: "Nissan",
  carModel: "240Z",
  carProductionYear: null,
  releaseYear: 2021,
  yearOnChassis: null,
  series: "",
  color: "",
  modelNumber: "",
  quantity: 1,
  priceAverage: [],
  openWindow: false,
  bigWing: false,
  frontBoltPositionOnEdge: false,
  backBoltPositionOnEdge: false,
};

async function renderTopBar() {
  const jsx = await TopBar();
  return render(jsx);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TopBar", () => {
  it("renders the app name", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });
    await renderTopBar();
    expect(screen.getByText("Hot Wheels Car Collection")).toBeInTheDocument();
  });

  it("renders the Add a car link pointing to /", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });
    await renderTopBar();
    const link = screen.getByRole("link", { name: "Add a car" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders the AI Assistant link pointing to /?assistant=true", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });
    await renderTopBar();
    const link = screen.getByRole("link", { name: "AI Assistant" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/?assistant=true");
  });
});

describe("Total value", () => {
  it("shows '—' when collection is empty", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });
    await renderTopBar();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows '—' when no item has a price", async () => {
    mockReadCollection.mockResolvedValue({
      items: [{ ...baseItem, priceAverage: [] }],
    });
    await renderTopBar();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("sums quantity × latest price for a single item", async () => {
    mockReadCollection.mockResolvedValue({
      items: [
        {
          ...baseItem,
          quantity: 2,
          priceAverage: [{ date: "2026-04-01", price: "30.00 PLN" }],
        },
      ],
    });
    await renderTopBar();
    expect(screen.getByText("60.00 PLN")).toBeInTheDocument();
  });

  it("sums across multiple items", async () => {
    mockReadCollection.mockResolvedValue({
      items: [
        {
          ...baseItem,
          id: "1",
          quantity: 1,
          priceAverage: [{ date: "2026-04-01", price: "40.00 PLN" }],
        },
        {
          ...baseItem,
          id: "2",
          quantity: 3,
          priceAverage: [{ date: "2026-04-01", price: "10.00 PLN" }],
        },
      ],
    });
    await renderTopBar();
    expect(screen.getByText("70.00 PLN")).toBeInTheDocument();
  });

  it("uses the most recent price entry when multiple dates exist", async () => {
    mockReadCollection.mockResolvedValue({
      items: [
        {
          ...baseItem,
          quantity: 1,
          priceAverage: [
            { date: "2025-01-01", price: "10.00 PLN" },
            { date: "2026-04-01", price: "50.00 PLN" },
          ],
        },
      ],
    });
    await renderTopBar();
    expect(screen.getByText("50.00 PLN")).toBeInTheDocument();
  });

  it("skips items that have no price entries", async () => {
    mockReadCollection.mockResolvedValue({
      items: [
        {
          ...baseItem,
          id: "1",
          quantity: 2,
          priceAverage: [{ date: "2026-04-01", price: "20.00 PLN" }],
        },
        { ...baseItem, id: "2", quantity: 5, priceAverage: [] },
      ],
    });
    await renderTopBar();
    expect(screen.getByText("40.00 PLN")).toBeInTheDocument();
  });

  it("renders the 'Total value:' label", async () => {
    mockReadCollection.mockResolvedValue({ items: [] });
    await renderTopBar();
    expect(screen.getByText(/Total value:/)).toBeInTheDocument();
  });
});
