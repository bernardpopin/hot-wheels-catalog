import type { NextRequest } from "next/server";
import { readCollection, writeCollection } from "@/app/lib/collection";
import type { CollectionItem } from "@/app/lib/collection";

export async function GET() {
  const data = await readCollection();
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Omit<CollectionItem, "id">;
  const data = await readCollection();

  const newItem: CollectionItem = {
    id: Date.now().toString(),
    modelName: body.modelName,
    carBrand: body.carBrand,
    carModel: body.carModel,
    carProductionYear: body.carProductionYear,
    releaseYear: body.releaseYear,
    yearOnChassis: body.yearOnChassis,
    series: body.series,
    color: body.color,
    modelNumber: body.modelNumber,
    priceRange: body.priceRange,
    openWindow: body.openWindow,
    bigWing: body.bigWing,
    frontBoltPositionOnEdge: body.frontBoltPositionOnEdge,
    backBoltPositionOnEdge: body.backBoltPositionOnEdge,
  };

  data.items.push(newItem);
  await writeCollection(data);

  return Response.json(newItem, { status: 201 });
}
