import { NextRequest, NextResponse } from "next/server";
import { buildFallbackReading, buildReadingPrompt, parseReadingResponse } from "@/lib/reading";
import type { ReadingContext } from "@/lib/reading";
import type { DailyReading } from "@/lib/types";

const GROQ_TIMEOUT_MS = 15000;
const DEFAULT_MODEL = "openai/gpt-oss-120b";
const MAX_REQUESTS_PER_HOUR = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const requestCounts = new Map<string, { count: number; windowStart: number }>();

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "local";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    requestCounts.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= MAX_REQUESTS_PER_HOUR) {
    return true;
  }

  entry.count += 1;
  return false;
}

async function callGroq(system: string, user: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL ?? DEFAULT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.7,
        // 400 tokens covers the reading itself, but openai/gpt-oss-120b is a
        // reasoning model: it spends tokens on internal chain-of-thought
        // before the actual JSON answer. reasoning_effort "low" keeps that
        // overhead small, and 600 leaves enough room for the reasoning +
        // the ~80-120 word reading -- verified against real Groq calls.
        max_tokens: 600,
        reasoning_effort: "low",
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Groq responded with status ${response.status}`);
    }

    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Groq response had no content");
    }
    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let context: ReadingContext;
  try {
    context = (await request.json()) as ReadingContext;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const date = context.dayThemes?.date;
  if (!date) {
    return NextResponse.json({ error: "Missing dayThemes.date" }, { status: 400 });
  }

  let reading: DailyReading;
  try {
    const { system, user } = buildReadingPrompt(context);
    const content = await callGroq(system, user);
    const parsed = parseReadingResponse(content, date);
    reading = parsed ?? buildFallbackReading(context.dayThemes);
  } catch (err) {
    // Never log request bodies -- just the fact that it failed and why,
    // which helps diagnose outages without exposing any user data.
    console.error("Reading request failed, using fallback:", err);
    reading = buildFallbackReading(context.dayThemes);
  }

  return NextResponse.json(reading);
}
