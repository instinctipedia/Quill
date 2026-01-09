import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FALLBACK_REPLY =
  "I’m with you. One line only — what’s hitting you hardest right now?";

function hasSupportTrigger(text: string): boolean {
  const t = text.toLowerCase();
  const phrases = [
    "i'm scared", "im scared", "scared", "terrified", "frightened",
    "panic", "panicking", "anxious", "anxiety", "overwhelmed",
    "can't cope", "cannot cope", "i can't cope", "i cannot cope",
    "i can't do this", "i cannot do this",
    "crying", "shaking",
    "i'm not ok", "im not ok",

    "alone", "lonely", "isolated", "no one to talk to",
    "insecure", "unsafe", "not safe", "i don't feel safe",

    "first time offshore", "first hitch", "first trip offshore",
    "new offshore", "new to offshore", "never been offshore before",
    "new starter", "newbie",

    "depressed", "depression", "mental health", "burnt out", "burned out",

    "marriage", "divorce", "relationship", "partner",

    "missing my family", "miss my family", "missing family", "homesick",
    "kids", "children", "my mum", "my dad",

    "personal issue", "personal problems", "stuff at home", "problems at home",
  ];
  return phrases.some((p) => t.includes(p));
}

function safeParseJson(raw: string): any {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {}

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const slice = trimmed.slice(start, end + 1);
    try {
      return JSON.parse(slice);
    } catch {}
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const text = String(body?.text ?? "").trim();
    const force_support = Boolean(body?.force_support);

    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const support = force_support || hasSupportTrigger(text);

    // This route is SUPPORT ONLY. If not support, tell the caller.
    if (!support) {
      return NextResponse.json({ error: "Support not triggered" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        mode: "support",
        reply: FALLBACK_REPLY,
        follow_up_question: "",
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
Return STRICT JSON ONLY.

Schema:
{ "reply": string, "follow_up_question": string }

Rules:
- No humour, no sarcasm.
- Brief validation (1–2 lines).
- 1–4 practical calming/grounding steps max.
- Ask ONE gentle question max.
- Do NOT mention incidents.
-You are calm, grounded, and unafraid of silence.
-You do not rush, fix, or escalate.
-You recognise before you advise.

-You sound like a human who has been here before — steady, present, and not surprised by what you’re hearing.

-Start by reflecting what you heard in plain language.
-Avoid labels, techniques, or mental-health jargon unless the user uses them first.

-Stay with the feeling for one turn longer than feels efficient.
-If you offer help, ask permission first.

-Your job is not to solve the problem.
-Your job is to make this moment safer to be in.

-This is human-centred safety.
-We haven’t lost the HSE core — we’ve wrapped it in care, instead of compliance.
-If the user shares grief, loss, shock, or something they cannot change right now, do NOT ask a question.
-Stay with them for one full turn longer than feels efficient.
-Silence and presence are valid responses.
-If the user repeats the same feeling (e.g. “depressed”, “still depressed”, “I already said that”), acknowledge that you heard it the first time.
-Do NOT ask another question in that turn.
-Name the repetition gently (e.g. “I hear that this hasn’t shifted”).
-Stay present rather than moving the conversation forward.



${text}
`.trim();

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return STRICT JSON ONLY. No markdown. No extra keys." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = safeParseJson(content);

    if (!parsed) {
      return NextResponse.json({
        mode: "support",
        reply: FALLBACK_REPLY,
        follow_up_question: "",
      });
    }

    const reply = String(parsed?.reply ?? "").trim() || FALLBACK_REPLY;
    const follow = String(parsed?.follow_up_question ?? "").trim();

    return NextResponse.json({
      mode: "support",
      reply,
      follow_up_question: follow,
    });
  } catch (err) {
    console.error("❌ POST /api/quill/support crashed:", err);
    return NextResponse.json({
      mode: "support",
      reply: FALLBACK_REPLY,
      follow_up_question: "",
    });
  }
}