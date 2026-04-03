import type { NextRequest } from "next/server";
import { readCatalog, writeCatalog } from "@/app/lib/catalog";
import type { CatalogItem } from "@/app/lib/catalog";

export async function GET() {
  const data = await readCatalog();
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Omit<CatalogItem, "id">;
  const data = await readCatalog();

  const newItem: CatalogItem = {
    id: Date.now().toString(),
    model: body.model,
    year: body.year,
    openWindow: body.openWindow,
    bigWing: body.bigWing,
    frontBoltPositionOnEdge: body.frontBoltPositionOnEdge,
    backBoltPositionOnEdge: body.backBoltPositionOnEdge,
  };

  data.items.push(newItem);
  await writeCatalog(data);

  return Response.json(newItem, { status: 201 });
}
