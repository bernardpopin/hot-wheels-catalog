import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AgentChat from "@/app/components/AgentChat";

const mockFetch = vi.fn();

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn() as typeof Element.prototype.scrollIntoView;
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function mockFetchResponse(data: object) {
  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve(data),
  });
}

describe("AgentChat — initial render", () => {
  it("renders the AI Assistant heading", () => {
    render(<AgentChat />);
    expect(screen.getByRole("heading", { name: "AI Assistant" })).toBeInTheDocument();
  });

  it("renders placeholder text when no messages exist", () => {
    render(<AgentChat />);
    expect(
      screen.getByText(/Ask me anything about your Hot Wheels car collection/)
    ).toBeInTheDocument();
  });

  it("renders the message input", () => {
    render(<AgentChat />);
    expect(screen.getByPlaceholderText("Ask about the collection...")).toBeInTheDocument();
  });

  it("renders the Send button", () => {
    render(<AgentChat />);
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("Send button is disabled when input is empty", () => {
    render(<AgentChat />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("Send button is enabled when input has non-whitespace text", async () => {
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "hello");
    expect(screen.getByRole("button", { name: "Send" })).not.toBeDisabled();
  });
});

describe("AgentChat — sending a message", () => {
  it("displays the user message in the chat after sending", async () => {
    mockFetchResponse({ output: "reply" });
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "How many cars?");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("How many cars?")).toBeInTheDocument();
  });

  it("clears the input after sending", async () => {
    mockFetchResponse({ output: "reply" });
    render(<AgentChat />);
    const input = screen.getByPlaceholderText("Ask about the collection...");
    await userEvent.type(input, "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(input).toHaveValue("");
  });

  it("does not send when input is only whitespace", async () => {
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "   ");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("sends a message on Enter key press", async () => {
    mockFetchResponse({ output: "reply" });
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "hello{Enter}");
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("POSTs to /api/chat with message and history in the body", async () => {
    mockFetchResponse({ output: "reply" });
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledOnce());

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/chat");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.message).toBe("hello");
    expect(body.history).toEqual([]);
  });
});

describe("AgentChat — loading state", () => {
  it("shows 'Thinking…' while awaiting a response", async () => {
    mockFetch.mockReturnValueOnce(new Promise<never>(() => {}));
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Thinking…")).toBeInTheDocument();
  });

  it("disables the input and Send button while loading", async () => {
    mockFetch.mockReturnValueOnce(new Promise<never>(() => {}));
    render(<AgentChat />);
    const input = screen.getByPlaceholderText("Ask about the collection...");
    await userEvent.type(input, "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => {
      expect(input).toBeDisabled();
      expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    });
  });
});

describe("AgentChat — assistant response", () => {
  it("displays reply from data.output", async () => {
    mockFetchResponse({ output: "I see 42 cars." });
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("I see 42 cars.")).toBeInTheDocument();
  });

  it("falls back to data.response when output is absent", async () => {
    mockFetchResponse({ response: "From response field." });
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("From response field.")).toBeInTheDocument();
  });

  it("falls back to data.message when output and response are absent", async () => {
    mockFetchResponse({ message: "From message field." });
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("From message field.")).toBeInTheDocument();
  });

  it("shows fallback text when no known response field is present", async () => {
    mockFetchResponse({ unknown: "field" });
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("No response from agent.")).toBeInTheDocument();
  });

  it("shows error message when fetch throws a network error", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Error: could not reach the agent.")).toBeInTheDocument();
  });

  it("hides the placeholder after the first message is sent", async () => {
    mockFetchResponse({ output: "reply" });
    render(<AgentChat />);
    await userEvent.type(screen.getByPlaceholderText("Ask about the collection..."), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("reply");
    expect(
      screen.queryByText(/Ask me anything about your Hot Wheels car collection/)
    ).not.toBeInTheDocument();
  });
});

describe("AgentChat — conversation history", () => {
  it("sends the prior conversation as history on a subsequent message", async () => {
    mockFetchResponse({ output: "first reply" });
    mockFetchResponse({ output: "second reply" });
    render(<AgentChat />);
    const input = screen.getByPlaceholderText("Ask about the collection...");

    await userEvent.type(input, "first message");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("first reply");

    await userEvent.type(input, "second message");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.message).toBe("second message");
    expect(body.history).toEqual([
      { role: "user", content: "first message" },
      { role: "assistant", content: "first reply" },
    ]);
  });
});
