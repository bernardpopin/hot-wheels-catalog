import { NextRequest, NextResponse } from "next/server";
import { readCollection } from "@/app/lib/collection";

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "N8N_WEBHOOK_URL is not configured" },
      { status: 500 }
    );
  }

  const { message, history } = await request.json();
  const { items } = await readCollection();

  const n8nResponse = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, collection: items }),
  });

  const data = await n8nResponse.json();
  return NextResponse.json(data, { status: n8nResponse.status });
}
