import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PriceUpdateButton from "@/app/components/PriceUpdateButton";

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function mockSuccess(updated: number, total: number) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ updated, total }),
  });
}

function mockErrorResponse() {
  mockFetch.mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ error: "No price sources configured" }),
  });
}

function mockNetworkError() {
  mockFetch.mockRejectedValue(new Error("Network error"));
}

// ---------------------------------------------------------------------------
// Helper: intercept only the 5-second reset timer.
//
// A full vi.useFakeTimers() breaks RTL's waitFor/findByRole because their
// internal polling setTimeout is also faked. Instead we spy on setTimeout,
// forward every call to the real implementation EXCEPT the 5 000 ms one,
// which we capture and cancel so we can invoke it manually via act().
// ---------------------------------------------------------------------------

function captureResetTimer() {
  const realSetTimeout = globalThis.setTimeout.bind(globalThis);
  let pendingId: ReturnType<typeof setTimeout> | undefined;
  let callback: (() => void) | undefined;

  vi.spyOn(globalThis, "setTimeout").mockImplementation(
    (cb: TimerHandler, delay?: number, ...args: unknown[]) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = realSetTimeout(cb as any, delay, ...args);
      if (delay === 5000) {
        pendingId = id;
        callback = cb as () => void;
      }
      return id;
    }
  );

  return {
    /** Cancels the real pending timer and manually fires the reset callback. */
    trigger() {
      if (pendingId !== undefined) clearTimeout(pendingId);
      pendingId = undefined;
      if (callback) act(() => callback!());
    },
    /** Cancels the pending timer without invoking it (used in cleanup). */
    cancel() {
      if (pendingId !== undefined) clearTimeout(pendingId);
      pendingId = undefined;
    },
  };
}

// ---------------------------------------------------------------------------
// Initial render
// ---------------------------------------------------------------------------

describe("initial render", () => {
  it("displays 'AI Update prices' label", () => {
    render(<PriceUpdateButton />);
    expect(screen.getByRole("button", { name: "AI Update prices" })).toBeInTheDocument();
  });

  it("is enabled by default", () => {
    render(<PriceUpdateButton />);
    expect(screen.getByRole("button")).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe("while updating", () => {
  it("shows 'Updating…' while fetch is in-flight", async () => {
    let resolveFetch!: (value: unknown) => void;
    mockFetch.mockReturnValue(new Promise((res) => (resolveFetch = res)));

    const user = userEvent.setup();
    render(<PriceUpdateButton />);

    // setStatus("loading") fires synchronously on click; the pending fetch keeps
    // the component in that state.
    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button", { name: "Updating…" })).toBeInTheDocument();

    // Resolve so the component drains before the test ends.
    resolveFetch({ ok: true, json: () => Promise.resolve({ updated: 0, total: 0 }) });
    await screen.findByRole("button", { name: /Updated/ });
  });

  it("is disabled while fetch is in-flight", async () => {
    let resolveFetch!: (value: unknown) => void;
    mockFetch.mockReturnValue(new Promise((res) => (resolveFetch = res)));

    const user = userEvent.setup();
    render(<PriceUpdateButton />);
    await user.click(screen.getByRole("button"));

    expect(screen.getByRole("button")).toBeDisabled();

    resolveFetch({ ok: true, json: () => Promise.resolve({ updated: 0, total: 0 }) });
    await screen.findByRole("button", { name: /Updated/ });
  });

  it("ignores a second click while loading", async () => {
    let resolveFetch!: (value: unknown) => void;
    mockFetch.mockReturnValue(new Promise((res) => (resolveFetch = res)));

    const user = userEvent.setup();
    render(<PriceUpdateButton />);

    await user.click(screen.getByRole("button")); // first click → loading
    await user.click(screen.getByRole("button")); // button disabled → userEvent skips

    expect(mockFetch).toHaveBeenCalledOnce();

    resolveFetch({ ok: true, json: () => Promise.resolve({ updated: 0, total: 0 }) });
    await screen.findByRole("button", { name: /Updated/ });
  });
});

// ---------------------------------------------------------------------------
// Success state
// ---------------------------------------------------------------------------

describe("on success", () => {
  it("shows 'Updated N/M' with the response counts", async () => {
    mockSuccess(3, 5);
    const user = userEvent.setup();
    render(<PriceUpdateButton />);

    await user.click(screen.getByRole("button"));

    expect(await screen.findByRole("button", { name: "Updated 3/5" })).toBeInTheDocument();
  });

  it("is enabled after success", async () => {
    mockSuccess(1, 1);
    const user = userEvent.setup();
    render(<PriceUpdateButton />);

    await user.click(screen.getByRole("button"));
    await screen.findByRole("button", { name: /Updated/ });

    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("POSTs to /api/update-prices", async () => {
    mockSuccess(0, 0);
    const user = userEvent.setup();
    render(<PriceUpdateButton />);

    await user.click(screen.getByRole("button"));
    await screen.findByRole("button", { name: /Updated/ });

    expect(mockFetch).toHaveBeenCalledWith("/api/update-prices", { method: "POST" });
  });
});

// ---------------------------------------------------------------------------
// Error state — non-ok response
// ---------------------------------------------------------------------------

describe("on non-ok response", () => {
  it("shows 'Error — retry?'", async () => {
    mockErrorResponse();
    const user = userEvent.setup();
    render(<PriceUpdateButton />);

    await user.click(screen.getByRole("button"));

    expect(await screen.findByRole("button", { name: "Error — retry?" })).toBeInTheDocument();
  });

  it("is enabled after error (retry allowed)", async () => {
    mockErrorResponse();
    const user = userEvent.setup();
    render(<PriceUpdateButton />);

    await user.click(screen.getByRole("button"));
    await screen.findByRole("button", { name: "Error — retry?" });

    expect(screen.getByRole("button")).not.toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// Error state — network failure
// ---------------------------------------------------------------------------

describe("on network error (fetch throws)", () => {
  it("shows 'Error — retry?'", async () => {
    mockNetworkError();
    const user = userEvent.setup();
    render(<PriceUpdateButton />);

    await user.click(screen.getByRole("button"));

    expect(await screen.findByRole("button", { name: "Error — retry?" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Auto-reset after 5 seconds
// ---------------------------------------------------------------------------

describe("auto-reset to idle after 5 seconds", () => {
  it("resets from 'done' to 'AI Update prices' after 5 s", async () => {
    const timer = captureResetTimer();

    mockSuccess(2, 4);
    const user = userEvent.setup();
    render(<PriceUpdateButton />);

    await user.click(screen.getByRole("button"));
    await screen.findByRole("button", { name: /Updated/ });

    timer.trigger();

    expect(screen.getByRole("button", { name: "AI Update prices" })).toBeInTheDocument();
  });

  it("resets from 'error' to 'AI Update prices' after 5 s", async () => {
    const timer = captureResetTimer();

    mockErrorResponse();
    const user = userEvent.setup();
    render(<PriceUpdateButton />);

    await user.click(screen.getByRole("button"));
    await screen.findByRole("button", { name: "Error — retry?" });

    timer.trigger();

    expect(screen.getByRole("button", { name: "AI Update prices" })).toBeInTheDocument();
  });

  it("does not reset before the callback fires", async () => {
    const timer = captureResetTimer();

    mockSuccess(1, 1);
    const user = userEvent.setup();
    render(<PriceUpdateButton />);

    await user.click(screen.getByRole("button"));
    await screen.findByRole("button", { name: /Updated/ });

    // Timer captured but not triggered — button still shows "Updated …"
    expect(screen.queryByRole("button", { name: "AI Update prices" })).not.toBeInTheDocument();

    timer.cancel(); // prevent the real 5 s timer from firing after unmount
  });
});
