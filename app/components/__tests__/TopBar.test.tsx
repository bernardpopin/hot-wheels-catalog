import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TopBar from "@/app/components/TopBar";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("TopBar", () => {
  it("renders the app name", () => {
    render(<TopBar />);
    expect(screen.getByText("Hot Wheels Catalog")).toBeInTheDocument();
  });

  it("renders the Add model link pointing to /", () => {
    render(<TopBar />);
    const link = screen.getByRole("link", { name: "Add model" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });
});
