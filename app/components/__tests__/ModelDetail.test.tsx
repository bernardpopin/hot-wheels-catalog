import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ModelDetail from "@/app/components/ModelDetail";
import type { CollectionItem } from "@/app/lib/collection";

vi.mock("@/app/lib/actions", () => ({
  deleteCollectionItem: vi.fn(),
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

const baseItem: CollectionItem = {
  id: "42",
  modelName: "Datsun 240Z Custom",
  carBrand: "Nissan",
  carModel: "240Z",
  carProductionYear: 1969,
  releaseYear: 2021,
  yearOnChassis: 2020,
  series: "HW Race Team",
  color: "Blue",
  modelNumber: "5/10",
  priceAverage: [],
  openWindow: true,
  bigWing: false,
  frontBoltPositionOnEdge: true,
  backBoltPositionOnEdge: false,
  quantity: 1,
};

describe("ModelDetail", () => {
  it("renders the model name as a heading", () => {
    render(<ModelDetail item={baseItem} onEdit={vi.fn()} />);
    expect(screen.getByText("Datsun 240Z Custom")).toBeInTheDocument();
  });

  it("displays car brand and car model", () => {
    render(<ModelDetail item={baseItem} onEdit={vi.fn()} />);
    expect(screen.getByText("Nissan")).toBeInTheDocument();
    expect(screen.getByText("240Z")).toBeInTheDocument();
  });

  it("displays year of production of the car", () => {
    render(<ModelDetail item={baseItem} onEdit={vi.fn()} />);
    expect(screen.getByText("1969")).toBeInTheDocument();
  });

  it("displays '—' for year of production when null", () => {
    render(<ModelDetail item={{ ...baseItem, carProductionYear: null }} onEdit={vi.fn()} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it("displays '—' for empty car brand", () => {
    render(<ModelDetail item={{ ...baseItem, carBrand: "" }} onEdit={vi.fn()} />);
    expect(screen.getByText("Car brand").nextElementSibling?.textContent ?? screen.getAllByText("—")[0]).toBeTruthy();
  });

  it("displays the release year", () => {
    render(<ModelDetail item={baseItem} onEdit={vi.fn()} />);
    expect(screen.getByText("2021")).toBeInTheDocument();
  });

  it("displays 'Yes' for true boolean fields", () => {
    render(<ModelDetail item={baseItem} onEdit={vi.fn()} />);
    const yesValues = screen.getAllByText("Yes");
    expect(yesValues).toHaveLength(2);
  });

  it("displays 'No' for false boolean fields", () => {
    render(<ModelDetail item={baseItem} onEdit={vi.fn()} />);
    const noValues = screen.getAllByText("No");
    expect(noValues).toHaveLength(2);
  });

  it("renders 'Yes' for all boolean fields when all are true", () => {
    const allTrue: CollectionItem = {
      ...baseItem,
      openWindow: true,
      bigWing: true,
      frontBoltPositionOnEdge: true,
      backBoltPositionOnEdge: true,
      quantity: 1,
    };
    render(<ModelDetail item={allTrue} onEdit={vi.fn()} />);
    expect(screen.getAllByText("Yes")).toHaveLength(4);
    expect(screen.queryByText("No")).not.toBeInTheDocument();
  });

  it("renders 'No' for all boolean fields when all are false", () => {
    const allFalse: CollectionItem = {
      ...baseItem,
      openWindow: false,
      bigWing: false,
      frontBoltPositionOnEdge: false,
      backBoltPositionOnEdge: false,
      quantity: 1,
    };
    render(<ModelDetail item={allFalse} onEdit={vi.fn()} />);
    expect(screen.getAllByText("No")).toHaveLength(4);
    expect(screen.queryByText("Yes")).not.toBeInTheDocument();
  });

  it("displays all row labels", () => {
    render(<ModelDetail item={baseItem} onEdit={vi.fn()} />);
    expect(screen.getByText("Car brand")).toBeInTheDocument();
    expect(screen.getByText("Car model")).toBeInTheDocument();
    expect(screen.getByText("Year of production of the car")).toBeInTheDocument();
    expect(screen.getByText("Release year")).toBeInTheDocument();
    expect(screen.getByText("Year on chassis")).toBeInTheDocument();
    expect(screen.getByText("Series")).toBeInTheDocument();
    expect(screen.getByText("Color")).toBeInTheDocument();
    expect(screen.getByText("Model number")).toBeInTheDocument();
    expect(screen.getByText("Price average")).toBeInTheDocument();
    expect(screen.getByText("Open window")).toBeInTheDocument();
    expect(screen.getByText("Big wing")).toBeInTheDocument();
    expect(screen.getByText("Front bolt position on edge")).toBeInTheDocument();
    expect(screen.getByText("Back bolt position on edge")).toBeInTheDocument();
  });

  it("renders the RemoveButton", () => {
    render(<ModelDetail item={baseItem} onEdit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("renders the Edit button", () => {
    render(<ModelDetail item={baseItem} onEdit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("calls onEdit when Edit button is clicked", async () => {
    const onEdit = vi.fn();
    render(<ModelDetail item={baseItem} onEdit={onEdit} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});
