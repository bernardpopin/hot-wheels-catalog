import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditForm from "@/app/components/EditForm";
import type { CollectionItem } from "@/app/lib/collection";

vi.mock("@/app/lib/actions", () => ({
  updateCollectionItem: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

import { updateCollectionItem } from "@/app/lib/actions";
import { useRouter } from "next/navigation";

const mockUpdateCollectionItem = vi.mocked(updateCollectionItem);
const mockUseRouter = vi.mocked(useRouter);
const mockRefresh = vi.fn();

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
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseRouter.mockReturnValue({ refresh: mockRefresh } as unknown as ReturnType<typeof useRouter>);
  mockUpdateCollectionItem.mockResolvedValue(baseItem);
});

describe("EditForm", () => {
  it("pre-fills model name from item", () => {
    render(<EditForm item={baseItem} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Model name")).toHaveValue("Datsun 240Z Custom");
  });

  it("pre-fills car brand from item", () => {
    render(<EditForm item={baseItem} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Car brand")).toHaveValue("Nissan");
  });

  it("pre-fills car model from item", () => {
    render(<EditForm item={baseItem} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Car model")).toHaveValue("240Z");
  });

  it("pre-fills year of production from item", () => {
    render(<EditForm item={baseItem} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Year of production of the car")).toHaveValue(1969);
  });

  it("pre-fills release year from item", () => {
    render(<EditForm item={baseItem} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Release year")).toHaveValue(2021);
  });

  it("pre-fills year on chassis from item", () => {
    render(<EditForm item={baseItem} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Year on chassis")).toHaveValue(2020);
  });

  it("pre-fills boolean checkboxes from item", () => {
    render(<EditForm item={baseItem} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Open window")).toBeChecked();
    expect(screen.getByLabelText("Big wing")).not.toBeChecked();
    expect(screen.getByLabelText("Front bolt position on edge")).toBeChecked();
    expect(screen.getByLabelText("Back bolt position on edge")).not.toBeChecked();
  });

  it("renders Cancel and Save buttons", () => {
    render(<EditForm item={baseItem} onDone={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("calls onDone when Cancel is clicked without calling updateCollectionItem", async () => {
    const onDone = vi.fn();
    render(<EditForm item={baseItem} onDone={onDone} />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDone).toHaveBeenCalledOnce();
    expect(mockUpdateCollectionItem).not.toHaveBeenCalled();
  });

  it("calls updateCollectionItem with correct id and updated values on submit", async () => {
    const onDone = vi.fn();
    render(<EditForm item={baseItem} onDone={onDone} />);

    await userEvent.clear(screen.getByLabelText("Model name"));
    await userEvent.type(screen.getByLabelText("Model name"), "Updated Name");
    await userEvent.clear(screen.getByLabelText("Car brand"));
    await userEvent.type(screen.getByLabelText("Car brand"), "Toyota");

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockUpdateCollectionItem).toHaveBeenCalledWith(
        "42",
        expect.objectContaining({
          modelName: "Updated Name",
          carBrand: "Toyota",
        })
      );
    });
  });

  it("calls router.refresh() after successful submit", async () => {
    render(<EditForm item={baseItem} onDone={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledOnce();
    });
  });

  it("calls onDone after successful submit", async () => {
    const onDone = vi.fn();
    render(<EditForm item={baseItem} onDone={onDone} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce();
    });
  });

  it("shows 'Saving…' while submission is in flight", async () => {
    let resolveUpdate!: () => void;
    mockUpdateCollectionItem.mockReturnValue(
      new Promise<never>((resolve) => {
        resolveUpdate = resolve as () => void;
      })
    );

    render(<EditForm item={baseItem} onDone={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    resolveUpdate();
  });

  it("shows empty string for nullable year on chassis when null", () => {
    render(<EditForm item={{ ...baseItem, yearOnChassis: null }} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Year on chassis")).toHaveValue(null);
  });

  it("shows empty string for nullable car production year when null", () => {
    render(<EditForm item={{ ...baseItem, carProductionYear: null }} onDone={vi.fn()} />);
    expect(screen.getByLabelText("Year of production of the car")).toHaveValue(null);
  });
});
