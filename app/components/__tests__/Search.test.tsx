import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Search from "@/app/components/Search";

const mockReplace = vi.fn();
const mockSearchParams = { get: vi.fn(), toString: vi.fn(() => "") };

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/",
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSearchParams.get.mockReturnValue(null);
  mockSearchParams.toString.mockReturnValue("");
});

describe("Search", () => {
  it("renders a search input", () => {
    render(<Search />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
  });

  it("initialises with the value from the q search param", () => {
    mockSearchParams.get.mockReturnValue("datsun");

    render(<Search />);

    expect(screen.getByRole("searchbox")).toHaveValue("datsun");
  });

  it("initialises with an empty value when q param is absent", () => {
    render(<Search />);
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("updates the URL with ?q= when the user types", async () => {
    render(<Search />);
    await userEvent.type(screen.getByRole("searchbox"), "acura");

    expect(mockReplace).toHaveBeenLastCalledWith(expect.stringContaining("q=acura"));
  });

  it("removes ?q param from the URL when the input is cleared", async () => {
    mockSearchParams.get.mockReturnValue("acura");
    mockSearchParams.toString.mockReturnValue("q=acura");

    render(<Search />);
    await userEvent.clear(screen.getByRole("searchbox"));

    const lastCall = mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0];
    expect(lastCall).not.toContain("q=");
  });

  it("removes ?selected param from the URL when the user types", async () => {
    mockSearchParams.toString.mockReturnValue("selected=42");

    render(<Search />);
    await userEvent.type(screen.getByRole("searchbox"), "a");

    const lastCall = mockReplace.mock.calls[mockReplace.mock.calls.length - 1][0];
    expect(lastCall).not.toContain("selected=");
  });
});
