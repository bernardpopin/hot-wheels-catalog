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
    expect(screen.getByText("Hot Wheels Car Collection")).toBeInTheDocument();
  });

  it("renders the Add a car link pointing to /", () => {
    render(<TopBar />);
    const link = screen.getByRole("link", { name: "Add a car" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders the AI Assistant link pointing to /?assistant=true", () => {
    render(<TopBar />);
    const link = screen.getByRole("link", { name: "AI Assistant" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/?assistant=true");
  });
});
