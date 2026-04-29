import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PriceChangeToast, {
  type PriceChangeNotification,
} from "@/app/components/PriceChangeToast";

function makeNotification(
  overrides: Partial<PriceChangeNotification> = {}
): PriceChangeNotification {
  return {
    id: 1,
    modelName: "Datsun 240Z Custom",
    oldPrice: "30.00 PLN",
    newPrice: "35.00 PLN",
    changePercent: 16.7,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Empty notifications
// ---------------------------------------------------------------------------

describe("when notifications is empty", () => {
  it("renders nothing", () => {
    const { container } = render(
      <PriceChangeToast notifications={[]} onDismiss={vi.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });
});

// ---------------------------------------------------------------------------
// Single notification — price increase
// ---------------------------------------------------------------------------

describe("price increase notification", () => {
  it("displays the model name", () => {
    render(
      <PriceChangeToast
        notifications={[makeNotification({ modelName: "Hot Wheels Camaro" })]}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText("Hot Wheels Camaro")).toBeInTheDocument();
  });

  it("shows old price and new price", () => {
    render(
      <PriceChangeToast
        notifications={[
          makeNotification({ oldPrice: "20.00 PLN", newPrice: "25.00 PLN" }),
        ]}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText(/20\.00 PLN/)).toBeInTheDocument();
    expect(screen.getByText(/25\.00 PLN/)).toBeInTheDocument();
  });

  it("shows the upward arrow for a positive change", () => {
    render(
      <PriceChangeToast
        notifications={[makeNotification({ changePercent: 10 })]}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText("↑")).toBeInTheDocument();
  });

  it("shows the + prefix for a positive changePercent", () => {
    render(
      <PriceChangeToast
        notifications={[makeNotification({ changePercent: 16.7 })]}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText(/\+16\.7%/)).toBeInTheDocument();
  });

  it("applies red colour class to the arrow for a price increase", () => {
    render(
      <PriceChangeToast
        notifications={[makeNotification({ changePercent: 5 })]}
        onDismiss={vi.fn()}
      />
    );
    const arrow = screen.getByText("↑");
    expect(arrow.className).toMatch(/text-red/);
  });
});

// ---------------------------------------------------------------------------
// Single notification — price decrease
// ---------------------------------------------------------------------------

describe("price decrease notification", () => {
  it("shows the downward arrow for a negative change", () => {
    render(
      <PriceChangeToast
        notifications={[makeNotification({ changePercent: -10 })]}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByText("↓")).toBeInTheDocument();
  });

  it("does not show the + prefix for a negative changePercent", () => {
    render(
      <PriceChangeToast
        notifications={[makeNotification({ changePercent: -8.5 })]}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.queryByText(/\+/)).not.toBeInTheDocument();
    expect(screen.getByText(/-8\.5%/)).toBeInTheDocument();
  });

  it("applies green colour class to the arrow for a price decrease", () => {
    render(
      <PriceChangeToast
        notifications={[makeNotification({ changePercent: -5 })]}
        onDismiss={vi.fn()}
      />
    );
    const arrow = screen.getByText("↓");
    expect(arrow.className).toMatch(/text-green/);
  });
});

// ---------------------------------------------------------------------------
// Dismiss button
// ---------------------------------------------------------------------------

describe("dismiss button", () => {
  it("has an accessible label", () => {
    render(
      <PriceChangeToast
        notifications={[makeNotification()]}
        onDismiss={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
  });

  it("calls onDismiss with the notification id when clicked", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <PriceChangeToast
        notifications={[makeNotification({ id: 42 })]}
        onDismiss={onDismiss}
      />
    );

    await user.click(screen.getByRole("button", { name: "Dismiss" }));

    expect(onDismiss).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledWith(42);
  });

  it("calls onDismiss with the correct id for each of multiple notifications", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(
      <PriceChangeToast
        notifications={[
          makeNotification({ id: 10, modelName: "Car A" }),
          makeNotification({ id: 20, modelName: "Car B" }),
        ]}
        onDismiss={onDismiss}
      />
    );

    const buttons = screen.getAllByRole("button", { name: "Dismiss" });
    await user.click(buttons[1]);

    expect(onDismiss).toHaveBeenCalledWith(20);
  });
});

// ---------------------------------------------------------------------------
// Multiple notifications
// ---------------------------------------------------------------------------

describe("multiple notifications", () => {
  it("renders one card per notification", () => {
    render(
      <PriceChangeToast
        notifications={[
          makeNotification({ id: 1, modelName: "Car A" }),
          makeNotification({ id: 2, modelName: "Car B" }),
          makeNotification({ id: 3, modelName: "Car C" }),
        ]}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText("Car A")).toBeInTheDocument();
    expect(screen.getByText("Car B")).toBeInTheDocument();
    expect(screen.getByText("Car C")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Dismiss" })).toHaveLength(3);
  });

  it("can render a mix of increases and decreases", () => {
    render(
      <PriceChangeToast
        notifications={[
          makeNotification({ id: 1, changePercent: 10 }),
          makeNotification({ id: 2, changePercent: -5 }),
        ]}
        onDismiss={vi.fn()}
      />
    );

    expect(screen.getByText("↑")).toBeInTheDocument();
    expect(screen.getByText("↓")).toBeInTheDocument();
  });
});
