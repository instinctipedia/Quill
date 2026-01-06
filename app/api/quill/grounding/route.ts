import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    note: "POST { concern } to this route.",
  });
}

type Incident = {
  title: string;
  date: string;
  what_happened: string;
  why_relevant: string[];
  source_url: string;
};

type LegislationItem = { title: string; why_it_applies: string; link: string };

function coerceLegislation(parsed: any): LegislationItem[] | null {
  // Accept either:
  // 1) legislation: [ { title, why_it_applies, link } ... ]
  // 2) legislation: { items: [ { name, duty, link } ... ] } (older schema)
  const leg = parsed?.legislation;

  if (Array.isArray(leg)) {
    const cleaned = leg
      .map((x: any) => ({
        title: String(x?.title ?? "").trim(),
        why_it_applies: String(x?.why_it_applies ?? "").trim(),
        link: String(x?.link ?? "").trim(),
      }))
      .filter((x: LegislationItem) => x.title && x.why_it_applies && x.link);
    return cleaned.length ? cleaned : null;
  }

  const items = leg?.items;
  if (Array.isArray(items)) {
    const cleaned = items
      .map((x: any) => ({
        title: String(x?.name ?? "").trim(),
        why_it_applies: String(x?.duty ?? "").trim(),
        link: String(x?.link ?? "").trim(),
      }))
      .filter((x: LegislationItem) => x.title && x.why_it_applies && x.link);
    return cleaned.length ? cleaned : null;
  }

  return null;
}

type Tier = "fatal_or_life_altering" | "serious_injury" | "incident";

function buildPrompt(tier: Tier, concern: string): string {
  const tierLine =
    tier === "fatal_or_life_altering"
      ? "Find EXACTLY ONE real-world OFFSHORE fatality OR life-altering injury incident"
      : tier === "serious_injury"
      ? "Find EXACTLY ONE real-world OFFSHORE serious injury incident (non-fatal, but major harm)"
      : "Find EXACTLY ONE real-world OFFSHORE incident/accident (significant event; may be dangerous occurrence/near miss)";

  const tierConstraint =
    tier === "fatal_or_life_altering"
      ? "- Extreme-only: fatality or life-altering injury"
      : tier === "serious_injury"
      ? "- Serious-injury: non-fatal but major harm (e.g., hospitalisation/major trauma/amputation etc.)"
      : "- Significant incident: credible severe potential (still offshore-only).";

  return `
Return STRICT JSON ONLY.

${tierLine}
where the user's concern would be a clear contributory factor.

Hard constraints:
- Offshore-only (platform, rig, vessel, offshore wind, marine ops)
${tierConstraint}
- Exactly ONE incident (no multiples)
- Prefer UK sources (HSE, MAIB). If none, best offshore source
- Do NOT fabricate
- If you cannot verify, return status="no_match"
- Provide ONE source_url

Then provide UK HSE legislation duties (Acts/Regs only) with plain-English duties.

Legislation rules (IMPORTANT):
- Acts/Regs only (no guidance)
- 2–5 items
- Each item MUST cite a specific section/regulation (e.g. "HSWA 1974 s.2(1)-(2)", "MHSWR 1999 reg.3")
- Each item link MUST be a legislation.gov.uk link that goes to that specific section/regulation page
  (not the top of the Act/Regs)

Schema:
{
  "status": "ok" | "no_match",
  "incident": {
    "title": string,
    "date": string,
    "what_happened": string,
    "why_relevant": string[],
    "source_url": string
  } | null,
  "legislation": {
    "title": string,
    "why_it_applies": string,
    "link": string
  }[] | null
}

User concern:
${concern}
`.trim();
}

async function callTier(
  client: OpenAI,
  tier: Tier,
  concern: string
): Promise<
  | { status: "ok"; incident: Incident; legislation: LegislationItem[] | null }
  | { status: "no_match" }
> {
  const prompt = buildPrompt(tier, concern);

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return STRICT JSON ONLY. No markdown. No extra keys." },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
  });

  const content = resp.choices[0]?.message?.content;
  if (!content) return { status: "no_match" };

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { status: "no_match" };
  }

  if (parsed?.status !== "ok" || !parsed?.incident) return { status: "no_match" };

  const incident: Incident = {
    title: String(parsed.incident?.title ?? "").trim(),
    date: String(parsed.incident?.date ?? "").trim(),
    what_happened: String(parsed.incident?.what_happened ?? "").trim(),
    why_relevant: Array.isArray(parsed.incident?.why_relevant)
      ? parsed.incident.why_relevant.map((x: any) => String(x ?? "").trim()).filter(Boolean)
      : [],
    source_url: String(parsed.incident?.source_url ?? "").trim(),
  };

  if (!incident.title || !incident.date || !incident.what_happened || !incident.source_url) {
    return { status: "no_match" };
  }

  const legislation = coerceLegislation(parsed);

  return { status: "ok", incident, legislation };
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const concern = String(body?.concern ?? "").trim();

    if (!concern) {
      return NextResponse.json({ error: "Missing concern" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const tiers: Tier[] = ["fatal_or_life_altering", "serious_injury", "incident"];

    for (const tier of tiers) {
      const out = await callTier(client, tier, concern);

      if (out.status === "ok") {
        return NextResponse.json({
          status: "ok",
          tier,
          incident: out.incident,
          legislation: out.legislation,
          note:
            tier === "fatal_or_life_altering"
              ? "Matched fatal/life-altering tier."
              : tier === "serious_injury"
              ? "No verified fatal/life-altering match found; returned a verified serious-injury case instead."
              : "No verified fatal/serious-injury match found; returned a verified offshore incident/accident instead.",
        });
      }
    }

    return NextResponse.json({
      status: "no_match",
      incident: null,
      legislation: null,
      note:
        "I couldn’t verify a suitable offshore case from your description. Go back and add 1–2 lines: task, equipment, what’s under tension/moving, where people stand, and what control is missing.",
    });
  } catch (err) {
    console.error("❌ POST /api/quill/grounding crashed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}