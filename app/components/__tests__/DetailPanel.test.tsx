import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DetailPanel from "@/app/components/DetailPanel";
import type { CollectionItem } from "@/app/lib/collection";

vi.mock("@/app/components/ModelDetail", () => ({
  default: ({ onEdit }: { onEdit: () => void }) => (
    <div>
      <span>ModelDetail</span>
      <button onClick={onEdit}>Edit</button>
    </div>
  ),
}));

vi.mock("@/app/components/EditForm", () => ({
  default: ({ onDone }: { onDone: () => void }) => (
    <div>
      <span>EditForm</span>
      <button onClick={onDone}>Done</button>
    </div>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const item: CollectionItem = {
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
  openWindow: false,
  bigWing: false,
  frontBoltPositionOnEdge: false,
  backBoltPositionOnEdge: false,
};

describe("DetailPanel", () => {
  it("renders ModelDetail by default", () => {
    render(<DetailPanel item={item} />);
    expect(screen.getByText("ModelDetail")).toBeInTheDocument();
    expect(screen.queryByText("EditForm")).not.toBeInTheDocument();
  });

  it("switches to EditForm when Edit is clicked", async () => {
    render(<DetailPanel item={item} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("EditForm")).toBeInTheDocument();
    expect(screen.queryByText("ModelDetail")).not.toBeInTheDocument();
  });

  it("switches back to ModelDetail when onDone is called", async () => {
    render(<DetailPanel item={item} />);
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.getByText("ModelDetail")).toBeInTheDocument();
    expect(screen.queryByText("EditForm")).not.toBeInTheDocument();
  });
});
