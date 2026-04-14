import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { CollectionItem } from "@/app/lib/collection";

vi.mock("@/app/lib/collection", () => ({
  readCollection: vi.fn(),
}));

import { POST } from "@/app/api/chat/route";
import { readCollection } from "@/app/lib/collection";

const mockReadCollection = vi.mocked(readCollection);
const mockFetch = vi.fn();

const item: CollectionItem = {
  id: "1",
  modelName: "Datsun 240Z Custom",
  carBrand: "Nissan",
  carModel: "240Z",
  carProductionYear: 1969,
  releaseYear: 2021,
  yearOnChassis: null,
  series: "",
  color: "Red",
  modelNumber: "043/250",
  priceRange: "Premium",
  openWindow: true,
  bigWing: false,
  frontBoltPositionOnEdge: true,
  backBoltPositionOnEdge: false,
};

function makeRequest(body: object) {
  return { json: async () => body } as Request;
}

function mockWebhookResponse(data: object, status = 200) {
  mockFetch.mockResolvedValueOnce({
    json: () => Promise.resolve(data),
    status,
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  vi.clearAllMocks();
  mockReadCollection.mockResolvedValue({ items: [] });
  delete process.env.N8N_WEBHOOK_URL;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("POST /api/chat", () => {
  it("returns 500 when N8N_WEBHOOK_URL is not configured", async () => {
    const res = await POST(makeRequest({ message: "hello", history: [] }) as never);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("N8N_WEBHOOK_URL is not configured");
  });

  it("does not call the webhook when N8N_WEBHOOK_URL is missing", async () => {
    await POST(makeRequest({ message: "hello", history: [] }) as never);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("forwards the request to the configured webhook URL", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.example.com/webhook/abc";
    mockWebhookResponse({ output: "reply" });

    await POST(makeRequest({ message: "hello", history: [] }) as never);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://n8n.example.com/webhook/abc",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("sends Content-Type: application/json to the webhook", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.example.com/webhook/abc";
    mockWebhookResponse({ output: "reply" });

    await POST(makeRequest({ message: "hello", history: [] }) as never);

    const [, init] = mockFetch.mock.calls[0];
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("includes message and history in the webhook request body", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.example.com/webhook/abc";
    const history = [{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }];
    mockWebhookResponse({ output: "reply" });

    await POST(makeRequest({ message: "tell me about cars", history }) as never);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.message).toBe("tell me about cars");
    expect(body.history).toEqual(history);
  });

  it("includes collection items in the webhook request body", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.example.com/webhook/abc";
    mockReadCollection.mockResolvedValue({ items: [item] });
    mockWebhookResponse({ output: "reply" });

    await POST(makeRequest({ message: "hello", history: [] }) as never);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.collection).toEqual([item]);
  });

  it("sends an empty collection array when the collection is empty", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.example.com/webhook/abc";
    mockReadCollection.mockResolvedValue({ items: [] });
    mockWebhookResponse({ output: "nothing here" });

    await POST(makeRequest({ message: "hello", history: [] }) as never);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.collection).toEqual([]);
  });

  it("proxies the webhook response data back to the caller", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.example.com/webhook/abc";
    mockWebhookResponse({ output: "I see 42 cars." });

    const res = await POST(makeRequest({ message: "hello", history: [] }) as never);
    const data = await res.json();

    expect(data.output).toBe("I see 42 cars.");
  });

  it("proxies the webhook response status back to the caller", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.example.com/webhook/abc";
    mockWebhookResponse({ error: "bad request" }, 400);

    const res = await POST(makeRequest({ message: "hello", history: [] }) as never);

    expect(res.status).toBe(400);
  });

  it("proxies a successful 200 status", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.example.com/webhook/abc";
    mockWebhookResponse({ output: "ok" }, 200);

    const res = await POST(makeRequest({ message: "hello", history: [] }) as never);

    expect(res.status).toBe(200);
  });
});
