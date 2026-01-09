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
- Default cases: 3. If moreCases=true: 8.
- Always return an "hse" array with at least 3 relevant section if possible, preferred 5.
Where possible, cite real laws/regulations/guidance/standards/best-practice with URLs; if not certain, name the law/regulation and duty without a URL.
- Aim to include, where you can:
  - one "uk" section,
  - one "IMO" section, and
  - one "guidance" section.
  - one "best-practice" section.
  - one "Regulatory" section
- For "uk": use real UK Acts/Regs with section/reg where you can
  (e.g. HSWA 1974, MHSWR 1999, LOLER, PUWER, Workplace Regs, Docks Regs),
  each with:
    - "name": the law or duty,
    - "detail": a short plain-English explanation of what it means offshore,
    - "minimum of 5 sentence explanation"
    - "url": an official or authoritative link (prefer legislation.gov.uk or HSE).
- For "international": use relevant IMO / ISM Code / SOLAS / STCW / ISO frameworks
  with plain-English detail and a sensible official or recognised guidance URL where possible.
- For "guidance": use IMCA, HSE guidance notes, MCA, or recognised industry best practice.
  Explain what the guidance is about and how it connects to the concern.
- Do not invent specific accident reports or fake citations. If you are not sure, omit "sourceUrl" for that item.
- If explainLaw=true, fill "explainLaw" with a short, practical summary of
  what the law or duty means in everyday offshore work (who must do what, and why it matters).
- You do not need to be exhaustive; pick a small set of the most relevant items quickly and clearly.
- Always provide reference setions or regulation numbers where possible.
`.trim();

  const user = JSON.stringify({ concern, moreCases, explainLaw });

  let result;
  try {
    result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
  } catch (err: any) {
    console.error("❌ OpenAI error in /api/quill/grounding:", err);
    return {
      status: "error",
      error: "AI is temporarily unavailable or rate-limited. Try again later.",
    };
  }


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