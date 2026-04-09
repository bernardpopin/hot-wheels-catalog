import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CatalogForm from "@/app/components/CatalogForm";

vi.mock("@/app/lib/actions", () => ({
  addCatalogItem: vi.fn(),
}));

import { addCatalogItem } from "@/app/lib/actions";

const mockAddCatalogItem = vi.mocked(addCatalogItem);

beforeEach(() => {
  vi.clearAllMocks();
  mockAddCatalogItem.mockResolvedValue({
    id: "new",
    model: "",
    year: 2024,
    openWindow: false,
    bigWing: false,
    frontBoltPositionOnEdge: false,
    backBoltPositionOnEdge: false,
  });
});

describe("CatalogForm", () => {
  it("renders the Model and Year inputs", () => {
    render(<CatalogForm />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("renders the four boolean checkboxes", () => {
    render(<CatalogForm />);
    expect(screen.getByLabelText("Open window")).toBeInTheDocument();
    expect(screen.getByLabelText("Big wing")).toBeInTheDocument();
    expect(screen.getByLabelText("Front bolt position on edge")).toBeInTheDocument();
    expect(screen.getByLabelText("Back bolt position on edge")).toBeInTheDocument();
  });

  it("renders the Save button", () => {
    render(<CatalogForm />);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("updates the model input value as the user types", async () => {
    render(<CatalogForm />);
    await userEvent.type(screen.getByRole("textbox"), "Datsun 240Z");
    expect(screen.getByRole("textbox")).toHaveValue("Datsun 240Z");
  });

  it("updates the year input value", async () => {
    render(<CatalogForm />);
    const yearInput = screen.getByRole("spinbutton");
    await userEvent.clear(yearInput);
    await userEvent.type(yearInput, "1995");
    expect(yearInput).toHaveValue(1995);
  });

  it("toggles a checkbox when clicked", async () => {
    render(<CatalogForm />);
    const checkbox = screen.getByLabelText("Open window");
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it("calls addCatalogItem with the correct values on submit", async () => {
    render(<CatalogForm />);

    await userEvent.type(screen.getByRole("textbox"), "Land Rover Defender 90");
    await userEvent.clear(screen.getByRole("spinbutton"));
    await userEvent.type(screen.getByRole("spinbutton"), "2023");
    await userEvent.click(screen.getByLabelText("Big wing"));

    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockAddCatalogItem).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "Land Rover Defender 90",
          year: 2023,
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

    render(<CatalogForm />);
    await userEvent.type(screen.getByRole("textbox"), "Car");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    resolveAdd();
  });

  it("resets the form after a successful submission", async () => {
    render(<CatalogForm />);

    await userEvent.type(screen.getByRole("textbox"), "Datsun 240Z");
    await userEvent.click(screen.getByLabelText("Open window"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("");
      expect(screen.getByLabelText("Open window")).not.toBeChecked();
    });
  });
});
