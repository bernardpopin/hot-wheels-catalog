import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import ModelDetail from "@/app/components/ModelDetail";
import type { CatalogItem } from "@/app/lib/catalog";

vi.mock("@/app/lib/actions", () => ({
  deleteCatalogItem: vi.fn(),
}));

vi.mock("@/app/components/RemoveButton", () => ({
  default: ({ action }: { action: () => Promise<void> }) => (
    <button onClick={action}>Remove</button>
  ),
}));

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
  vi.clearAllMocks();
});

const baseItem: CatalogItem = {
  id: "42",
  model: "Datsun 240Z Custom",
  year: 2021,
  openWindow: true,
  bigWing: false,
  frontBoltPositionOnEdge: true,
  backBoltPositionOnEdge: false,
};

describe("ModelDetail", () => {
  it("renders the model name as a heading", () => {
    render(<ModelDetail item={baseItem} />);
    expect(screen.getByText("Datsun 240Z Custom")).toBeInTheDocument();
  });

  it("displays the year", () => {
    render(<ModelDetail item={baseItem} />);
    expect(screen.getByText("2021")).toBeInTheDocument();
  });

  it("displays 'Yes' for true boolean fields", () => {
    render(<ModelDetail item={baseItem} />);
    // openWindow and frontBoltPositionOnEdge are true
    const yesValues = screen.getAllByText("Yes");
    expect(yesValues).toHaveLength(2);
  });

  it("displays 'No' for false boolean fields", () => {
    render(<ModelDetail item={baseItem} />);
    // bigWing and backBoltPositionOnEdge are false
    const noValues = screen.getAllByText("No");
    expect(noValues).toHaveLength(2);
  });

  it("renders 'Yes' for all boolean fields when all are true", () => {
    const allTrue: CatalogItem = {
      ...baseItem,
      openWindow: true,
      bigWing: true,
      frontBoltPositionOnEdge: true,
      backBoltPositionOnEdge: true,
    };
    render(<ModelDetail item={allTrue} />);
    expect(screen.getAllByText("Yes")).toHaveLength(4);
    expect(screen.queryByText("No")).not.toBeInTheDocument();
  });

  it("renders 'No' for all boolean fields when all are false", () => {
    const allFalse: CatalogItem = {
      ...baseItem,
      openWindow: false,
      bigWing: false,
      frontBoltPositionOnEdge: false,
      backBoltPositionOnEdge: false,
    };
    render(<ModelDetail item={allFalse} />);
    expect(screen.getAllByText("No")).toHaveLength(4);
    expect(screen.queryByText("Yes")).not.toBeInTheDocument();
  });

  it("displays all row labels", () => {
    render(<ModelDetail item={baseItem} />);
    expect(screen.getByText("Year")).toBeInTheDocument();
    expect(screen.getByText("Open window")).toBeInTheDocument();
    expect(screen.getByText("Big wing")).toBeInTheDocument();
    expect(screen.getByText("Front bolt position on edge")).toBeInTheDocument();
    expect(screen.getByText("Back bolt position on edge")).toBeInTheDocument();
  });

  it("renders the RemoveButton", () => {
    render(<ModelDetail item={baseItem} />);
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });
});
