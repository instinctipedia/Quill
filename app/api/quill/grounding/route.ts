import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CaseItem = {
  title: string;
  date?: string;
  summary?: string;
  sourceUrl?: string;
  severity: 1 | 2 | 3 | 4 | 5;
};

type HSEOrigin = "uk" | "international" | "guidance";

type HSESection = {
  title: string;
  origin: HSEOrigin;
  items: { name: string; detail?: string; url?: string }[];
};

type GroundingResponse = {
  status: "ok" | "no_match" | "error";
  concern?: string;
  note?: string;
  cases?: CaseItem[];
  allCasesCount?: number;
  hse?: HSESection[];
  explainLaw?: { title: string; text: string } | null;
  error?: string;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function isValidResponseShape(x: any): x is GroundingResponse {
  if (!x || typeof x !== "object") return false;
  if (x.status !== "ok" && x.status !== "no_match" && x.status !== "error") return false;

  if (x.status === "ok") {
    if (typeof x.concern !== "string") return false;
    if (!Array.isArray(x.cases)) return false;
    if (!Array.isArray(x.hse)) return false;
  }
  return true;
}

async function aiResponse(
  concern: string,
  moreCases: boolean,
  explainLaw: boolean
): Promise<GroundingResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return { status: "error", error: "OPENAI_API_KEY is not set on the server." };
  }

  const system = `
Return STRICT JSON only (no markdown, no commentary).

Schema:
{
  "status": "ok" | "no_match" | "error",
  "concern": string,
  "cases": Array<{
    "title": string,
    "date"?: string,
    "summary"?: string,
    "sourceUrl"?: string,
    "severity": 1|2|3|4|5
  }>,
  "allCasesCount"?: number,
  "hse": Array<{
    "title": string,
    "origin": "uk" | "international" | "guidance",
    "items": Array<{ "name": string, "detail"?: string, "url"?: string }>
  }>,
  "explainLaw"?: { "title": string, "text": string } | null,
  "note"?: string
}

Rules:
- Absolutely DO NOT include imageUrl or imageAlt.
- Default cases: 2. If moreCases=true: 4.
- "uk" = UK Acts/Regs with specific section/reg + legislation.gov.uk links where possible.
- "international" = maritime / global framework (IMO/ISM/SOLAS/STCW, ISO where relevant).
- "guidance" = IMCA, ACOP/industry guidance/best practice.
- Do not invent accident reports or fake citations. If unsure, omit sourceUrl.
- If explainLaw=true, fill explainLaw with practical plain-English meaning.
`.trim();

  const user = JSON.stringify({ concern, moreCases, explainLaw });

  const result = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = result.choices?.[0]?.message?.content ?? "";
  let parsed: any;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "error", error: "AI returned non-JSON output." };
  }

  if (!isValidResponseShape(parsed)) {
    return { status: "error", error: "AI JSON did not match expected schema." };
  }

  if (parsed.status === "ok" && Array.isArray(parsed.cases)) {
    const target = moreCases ? 4 : 2;
    parsed.cases = parsed.cases.slice(0, target);
    parsed.allCasesCount =
      typeof parsed.allCasesCount === "number" ? parsed.allCasesCount : parsed.cases.length;
  }

  return parsed;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const concern = (searchParams.get("concern") || "").trim();
  const moreCases = searchParams.get("more_cases") === "1";
  const explainLaw = searchParams.get("explain_law") === "1";

  if (!concern) {
    return NextResponse.json(
      { status: "error", error: "Missing concern." },
      { status: 400 }
    );
  }

  // AI-only. No static fallback.
  const ai = await aiResponse(concern, moreCases, explainLaw);

  // Always return 200 so GroundingClient can read JSON and show the error message cleanly.
  return NextResponse.json(ai, { status: 200 });
}