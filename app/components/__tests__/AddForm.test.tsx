import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AddForm from "@/app/components/AddForm";

vi.mock("@/app/lib/actions", () => ({
  addCatalogItem: vi.fn(),
}));

import { addCatalogItem } from "@/app/lib/actions";

const mockAddCatalogItem = vi.mocked(addCatalogItem);

beforeEach(() => {
  vi.clearAllMocks();
  mockAddCatalogItem.mockResolvedValue({
    id: "new",
    modelName: "",
    carBrand: "",
    carModel: "",
    carProductionYear: null,
    releaseYear: 2024,
    yearOnChassis: null,
    series: "",
    color: "",
    modelNumber: "",
    priceRange: "",
    openWindow: false,
    bigWing: false,
    frontBoltPositionOnEdge: false,
    backBoltPositionOnEdge: false,
  });
});

describe("AddForm", () => {
  it("renders all text and number inputs", () => {
    render(<AddForm />);
    expect(screen.getByLabelText("Model name")).toBeInTheDocument();
    expect(screen.getByLabelText("Car brand")).toBeInTheDocument();
    expect(screen.getByLabelText("Car model")).toBeInTheDocument();
    expect(screen.getByLabelText("Year of production of the car")).toBeInTheDocument();
    expect(screen.getByLabelText("Release year")).toBeInTheDocument();
    expect(screen.getByLabelText("Year on chassis")).toBeInTheDocument();
    expect(screen.getByLabelText("Series")).toBeInTheDocument();
    expect(screen.getByLabelText("Color")).toBeInTheDocument();
    expect(screen.getByLabelText("Model number")).toBeInTheDocument();
    expect(screen.getByLabelText("Price range")).toBeInTheDocument();
  });

  it("renders the four boolean checkboxes", () => {
    render(<AddForm />);
    expect(screen.getByLabelText("Open window")).toBeInTheDocument();
    expect(screen.getByLabelText("Big wing")).toBeInTheDocument();
    expect(screen.getByLabelText("Front bolt position on edge")).toBeInTheDocument();
    expect(screen.getByLabelText("Back bolt position on edge")).toBeInTheDocument();
  });

  it("renders the Save button", () => {
    render(<AddForm />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("updates the model name input value as the user types", async () => {
    render(<AddForm />);
    await userEvent.type(screen.getByLabelText("Model name"), "Datsun 240Z");
    expect(screen.getByLabelText("Model name")).toHaveValue("Datsun 240Z");
  });

  it("updates the car brand input value", async () => {
    render(<AddForm />);
    await userEvent.type(screen.getByLabelText("Car brand"), "Nissan");
    expect(screen.getByLabelText("Car brand")).toHaveValue("Nissan");
  });

  it("updates the car model input value", async () => {
    render(<AddForm />);
    await userEvent.type(screen.getByLabelText("Car model"), "240Z");
    expect(screen.getByLabelText("Car model")).toHaveValue("240Z");
  });

  it("updates the year of production input", async () => {
    render(<AddForm />);
    const input = screen.getByLabelText("Year of production of the car");
    await userEvent.type(input, "1969");
    expect(input).toHaveValue(1969);
  });

  it("sets year of production to null when cleared", async () => {
    render(<AddForm />);
    const input = screen.getByLabelText("Year of production of the car");
    await userEvent.type(input, "1969");
    await userEvent.clear(input);
    expect(input).toHaveValue(null);
  });

  it("updates the release year input value", async () => {
    render(<AddForm />);
    const input = screen.getByLabelText("Release year");
    await userEvent.clear(input);
    await userEvent.type(input, "1995");
    expect(input).toHaveValue(1995);
  });

  it("toggles a checkbox when clicked", async () => {
    render(<AddForm />);
    const checkbox = screen.getByLabelText("Open window");
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("calls addCatalogItem with the correct values on submit", async () => {
    render(<AddForm />);

    await userEvent.type(screen.getByLabelText("Model name"), "Land Rover Defender 90");
    await userEvent.type(screen.getByLabelText("Car brand"), "Land Rover");
    await userEvent.type(screen.getByLabelText("Car model"), "Defender 90");
    await userEvent.type(screen.getByLabelText("Year of production of the car"), "1983");
    await userEvent.clear(screen.getByLabelText("Release year"));
    await userEvent.type(screen.getByLabelText("Release year"), "2023");
    await userEvent.click(screen.getByLabelText("Big wing"));

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockAddCatalogItem).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: "Land Rover Defender 90",
          carBrand: "Land Rover",
          carModel: "Defender 90",
          carProductionYear: 1983,
          releaseYear: 2023,
          bigWing: true,
        })
      );
    });
  });

  it("shows 'Saving…' while the submission is in flight", async () => {
    let resolveAdd!: () => void;
    mockAddCatalogItem.mockReturnValue(
      new Promise<never>((resolve) => { resolveAdd = resolve as () => void; })
    );

    render(<AddForm />);
    await userEvent.type(screen.getByLabelText("Model name"), "Car");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    resolveAdd();
  });

  it("resets the form after a successful submission", async () => {
    render(<AddForm />);

    await userEvent.type(screen.getByLabelText("Model name"), "Datsun 240Z");
    await userEvent.type(screen.getByLabelText("Car brand"), "Nissan");
    await userEvent.click(screen.getByLabelText("Open window"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Model name")).toHaveValue("");
      expect(screen.getByLabelText("Car brand")).toHaveValue("");
      expect(screen.getByLabelText("Open window")).not.toBeChecked();
    });
  });
});
