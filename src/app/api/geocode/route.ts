import { NextRequest, NextResponse } from "next/server";
import tzlookup from "tz-lookup";
import { buildNominatimUrl, mapNominatimResults, type NominatimResult } from "@/lib/geocode";

const MIN_QUERY_LENGTH = 3;
const MIN_INTERVAL_MS = 1000;

let queue: Promise<unknown> = Promise.resolve();
let lastCallAt = 0;

function scheduleNominatimCall<T>(fn: () => Promise<T>): Promise<T> {
  const run = async () => {
    const wait = Math.max(0, lastCallAt + MIN_INTERVAL_MS - Date.now());
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastCallAt = Date.now();
    return fn();
  };
  const result = queue.then(run, run);
  queue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json([]);
  }

  const contactEmail = process.env.CONTACT_EMAIL;
  if (!contactEmail) {
    return NextResponse.json(
      { error: "CONTACT_EMAIL is not configured" },
      { status: 500 },
    );
  }

  try {
    const response = await scheduleNominatimCall(() =>
      fetch(buildNominatimUrl(q), {
        headers: {
          "User-Agent": `Astro Planner (${contactEmail})`,
        },
      }),
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Place search failed" }, { status: 502 });
    }

    const raw = (await response.json()) as NominatimResult[];
    return NextResponse.json(mapNominatimResults(raw, tzlookup));
  } catch {
    return NextResponse.json({ error: "Place search failed" }, { status: 502 });
  }
}
