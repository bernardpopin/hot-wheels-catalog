import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PriceEntry } from "@/app/lib/collection";
import { filterByRange } from "@/app/components/PriceChart";

// Mock react-chartjs-2: expose labels and values as text so we can assert on them.
vi.mock("react-chartjs-2", () => ({
  Line: ({
    data,
  }: {
    data: { labels: string[]; datasets: { data: number[] }[] };
  }) => (
    <div data-testid="line-chart">
      <span data-testid="chart-labels">{data.labels.join(",")}</span>
      <span data-testid="chart-values">{data.datasets[0].data.join(",")}</span>
    </div>
  ),
}));

// chart.js itself tries to access the DOM canvas — mock the module so
// ChartJS.register() is a no-op in the test environment.
vi.mock("chart.js", () => {
  const noop = () => {};
  const ChartJS = { register: noop };
  return {
    Chart: ChartJS,
    CategoryScale: noop,
    LinearScale: noop,
    PointElement: noop,
    LineElement: noop,
    Tooltip: noop,
    Filler: noop,
  };
});

import PriceChart from "@/app/components/PriceChart";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TODAY = new Date().toISOString().split("T")[0];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function monthsAgo(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().split("T")[0];
}

const OLD_ENTRY: PriceEntry = { date: "2020-01-01", price: "10.00 PLN" };
const RECENT_ENTRY: PriceEntry = { date: TODAY, price: "50.00 PLN" };

// ---------------------------------------------------------------------------
// filterByRange — unit tests (pure function, no rendering)
// ---------------------------------------------------------------------------

describe("filterByRange", () => {
  const entries: PriceEntry[] = [
    { date: "2020-01-01", price: "5.00 PLN" },
    { date: monthsAgo(2), price: "10.00 PLN" },
    { date: monthsAgo(5), price: "20.00 PLN" },
    { date: monthsAgo(10), price: "30.00 PLN" },
    { date: TODAY, price: "40.00 PLN" },
  ];

  it("'all' returns every entry unchanged", () => {
    expect(filterByRange(entries, "all")).toHaveLength(entries.length);
  });

  it("'1m' returns only entries within the last month", () => {
    const result = filterByRange(entries, "1m");
    expect(result.every((e) => e.date >= monthsAgo(1))).toBe(true);
  });

  it("'3m' returns only entries within the last 3 months", () => {
    const result = filterByRange(entries, "3m");
    expect(result.every((e) => e.date >= monthsAgo(3))).toBe(true);
  });

  it("'6m' returns only entries within the last 6 months", () => {
    const result = filterByRange(entries, "6m");
    expect(result.every((e) => e.date >= monthsAgo(6))).toBe(true);
  });

  it("'1y' returns only entries within the last 12 months", () => {
    const result = filterByRange(entries, "1y");
    expect(result.every((e) => e.date >= monthsAgo(12))).toBe(true);
  });

  it("a narrow range excludes entries outside it", () => {
    const result = filterByRange(entries, "1m");
    expect(result.some((e) => e.date < monthsAgo(1))).toBe(false);
  });

  it("returns an empty array when all entries are older than the range", () => {
    const old: PriceEntry[] = [{ date: "2020-01-01", price: "1.00 PLN" }];
    expect(filterByRange(old, "1m")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// PriceChart component
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe("when priceAverage is empty", () => {
  it("renders nothing", () => {
    const { container } = render(<PriceChart priceAverage={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("with price data", () => {
  const entries: PriceEntry[] = [
    { date: "2026-01-01", price: "20.00 PLN" },
    { date: "2026-03-15", price: "35.00 PLN" },
    { date: "2026-04-01", price: "50.00 PLN" },
  ];

  it("renders the 'Price history' heading", () => {
    render(<PriceChart priceAverage={entries} />);
    expect(screen.getByText("Price history")).toBeInTheDocument();
  });

  it("renders all five range buttons", () => {
    render(<PriceChart priceAverage={entries} />);
    for (const label of ["1M", "3M", "6M", "1Y", "All"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("'All' is active by default", () => {
    render(<PriceChart priceAverage={entries} />);
    const allBtn = screen.getByRole("button", { name: "All" });
    expect(allBtn.className).toContain("bg-zinc-900");
  });

  it("inactive range buttons do not have the active class", () => {
    render(<PriceChart priceAverage={entries} />);
    for (const label of ["1M", "3M", "6M", "1Y"]) {
      const btn = screen.getByRole("button", { name: label });
      expect(btn.className).not.toContain("bg-zinc-900");
    }
  });

  it("renders the chart with all entries sorted by date", () => {
    // Provide entries out of order to verify sorting
    const unsorted: PriceEntry[] = [
      { date: "2026-04-01", price: "50.00 PLN" },
      { date: "2026-01-01", price: "20.00 PLN" },
      { date: "2026-03-15", price: "35.00 PLN" },
    ];
    render(<PriceChart priceAverage={unsorted} />);
    expect(screen.getByTestId("chart-labels").textContent).toBe(
      "2026-01-01,2026-03-15,2026-04-01"
    );
    expect(screen.getByTestId("chart-values").textContent).toBe("20,35,50");
  });

  it("parses the numeric part of price strings correctly", () => {
    const data: PriceEntry[] = [{ date: TODAY, price: "123.45 PLN" }];
    render(<PriceChart priceAverage={data} />);
    expect(screen.getByTestId("chart-values").textContent).toBe("123.45");
  });
});

describe("range button interaction", () => {
  it("clicking a range button makes it active", async () => {
    const entries: PriceEntry[] = [
      { date: daysAgo(5), price: "10.00 PLN" },
      { date: daysAgo(10), price: "20.00 PLN" },
    ];
    const user = userEvent.setup();
    render(<PriceChart priceAverage={entries} />);

    await user.click(screen.getByRole("button", { name: "1M" }));

    expect(screen.getByRole("button", { name: "1M" }).className).toContain("bg-zinc-900");
    expect(screen.getByRole("button", { name: "All" }).className).not.toContain("bg-zinc-900");
  });

  it("switching range updates the chart data", async () => {
    // Entry older than 1M but within All
    const entries: PriceEntry[] = [
      { date: monthsAgo(3), price: "10.00 PLN" },
      { date: daysAgo(5), price: "30.00 PLN" },
    ];
    const user = userEvent.setup();
    render(<PriceChart priceAverage={entries} />);

    // All: both entries visible
    expect(screen.getByTestId("chart-values").textContent).toBe("10,30");

    await user.click(screen.getByRole("button", { name: "1M" }));

    // 1M: only the recent entry
    expect(screen.getByTestId("chart-values").textContent).toBe("30");
  });
});

describe("when filtered range has no data", () => {
  it("shows 'No data for this period.' instead of the chart", async () => {
    const user = userEvent.setup();
    render(<PriceChart priceAverage={[OLD_ENTRY]} />);

    await user.click(screen.getByRole("button", { name: "1M" }));

    expect(screen.getByText("No data for this period.")).toBeInTheDocument();
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
  });

  it("still shows range buttons when there is no data for the period", async () => {
    const user = userEvent.setup();
    render(<PriceChart priceAverage={[OLD_ENTRY]} />);

    await user.click(screen.getByRole("button", { name: "1M" }));

    for (const label of ["1M", "3M", "6M", "1Y", "All"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("switching back to 'All' restores the chart", async () => {
    const user = userEvent.setup();
    render(<PriceChart priceAverage={[OLD_ENTRY]} />);

    await user.click(screen.getByRole("button", { name: "1M" }));
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });
});

describe("single entry", () => {
  it("renders the chart with a single data point", () => {
    render(<PriceChart priceAverage={[RECENT_ENTRY]} />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("chart-values").textContent).toBe("50");
  });
});
