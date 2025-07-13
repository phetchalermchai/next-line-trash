import * as turf from "@turf/turf";
import { prisma } from "@/lib/prisma";

export async function findZoneByLatLng(lat: number, lng: number) {
  const zones = await prisma.zone.findMany();
  const pt = turf.point([lng, lat]);
  for (const zone of zones) {
    if (!zone.polygon) continue;
    // zone.polygon = [[lat, lng], ...]
    let coords = zone.polygon as [number, number][];
    // เช็กว่าปิดลูปหรือยัง ถ้ายัง ให้เพิ่มจุดแรกไปท้าย array
    if (
      coords.length > 2 &&
      (coords[0][0] !== coords[coords.length - 1][0] ||
        coords[0][1] !== coords[coords.length - 1][1])
    ) {
      coords = [...coords, coords[0]];
    }
    const turfPoly = turf.polygon([coords.map(([lat, lng]) => [lng, lat])]);
    const isInside = turf.booleanPointInPolygon(pt, turfPoly);
    if (isInside) {
      return zone;
    }
  }
  return null;
}
