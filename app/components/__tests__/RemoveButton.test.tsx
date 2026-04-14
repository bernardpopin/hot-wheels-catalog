import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RemoveButton from "@/app/components/RemoveButton";

// jsdom doesn't implement showModal/close on HTMLDialogElement
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute("open", "");
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute("open");
  });
});

describe("RemoveButton", () => {
  it("renders the trigger Remove button", () => {
    render(<RemoveButton action={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Remove" })).toBeInTheDocument();
  });

  it("the confirmation dialog is not open initially", () => {
    render(<RemoveButton action={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { hidden: true });
    expect(dialog).not.toHaveAttribute("open");
  });

  it("opens the confirmation dialog when the trigger button is clicked", async () => {
    render(<RemoveButton action={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it("closes the dialog when Cancel is clicked", async () => {
    render(<RemoveButton action={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  it("calls the action when the confirm Remove button is submitted", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    render(<RemoveButton action={action} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    const form = screen.getByRole("dialog", { hidden: true }).querySelector("form")!;
    form.requestSubmit();

    expect(action).toHaveBeenCalled();
  });

  it("shows a confirmation message inside the dialog", async () => {
    render(<RemoveButton action={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(
      screen.getByText("Are you sure you want to remove this car?")
    ).toBeInTheDocument();
  });
});
