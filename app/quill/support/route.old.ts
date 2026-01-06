import OpenAI from "openai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Canonical Quill openers (verbatim) — do not clip, paraphrase, or edit.
 */
const QUILL_OPENERS: string[] = [
  "Sonia sent you here while this is still a conversation and not yet a clean-up. That usually means we’ve got a window. What’s starting to look like it won’t stay boring?",
  "Right — this is the bit before everything tips from “bit dodgy” into “well, that went to shit”. Let’s get ahead of it. What’s lining itself up?",
  "Sonia routed you here before the fan’s spinning and the explanations start. Good call. What’s about to get flung everywhere?",
  "You’ve arrived in the narrow gap where we can still change the ending instead of narrating it afterwards. That’s rare. What’s brewing?",
  "Sonia doesn’t send people once it’s already gone bang — she sends them just before. So tell me what’s primed and waiting.",
  "This feels like the calm moment right before someone says “oh shit” and everything speeds up. Let’s avoid that sentence. What’s happening?",
  "Sonia sent you early enough that nobody’s pretending this was unavoidable yet. That’s useful. What’s the first thing that breaks if we do nothing?",
  "We’re still in the phase where this is a concern, not a salvage operation. That’s the best time to talk. What’s building?",
  "If this carries on unchanged, what’s the point where everyone looks at each other and goes “yeah… that tracks”? Let’s stop there.",
  "Sonia routed you here before the fan starts doing what fans do. What’s standing in its line of fire?",
  "Good — you’re here while this is still uncomfortable, not expensive or painful. That’s a gift. What’s the pressure point?",
  "This is the moment before things get loud, fast, or properly memorable for the wrong reasons. Let’s intervene. What’s the risk?",
  "Sonia sent you while “near miss” still applies. What’s the *near* bit before it graduates into something with forms?",
  "Let’s deal with this while it’s still a conversation you can have standing up, not a debrief you sit through later. What’s the trigger?",
  "You don’t end up here unless something’s about to tip from mildly shit into properly shit. What’s tipping?",
  "Sonia routed you here before anyone’s rehearsing the phrase “in hindsight”. That’s the sweet spot. What’s the first domino?",
  "This is still a heads-up, not an “ah hell” moment. That window doesn't stay open long. What's off?",
  "If nothing changes, what’s the exact moment everyone realises this was a bad idea? Let’s not reach it.",
  "Sonia sent you while the mess is still theoretical and nobody’s sweeping yet. Let’s keep it hypothetical. What’s the mechanism?",
  "This is the bit where we can still say “good catch” instead of “how the hell did we miss that?”. What did you catch?",
  "You’re here before the phrase “we should’ve sorted that” starts doing serious work. Let’s sort it. What’s wrong?",
  "Sonia doesn’t escalate after the bang — she escalates just before. So what’s primed to go bang if left alone?",
  "This is the last sensible moment before chaos starts adding its own commentary. What’s being ignored?",
  "If this keeps going, what’s the point where it all turns to shit and everyone pretends they saw it coming? Let’s beat that.",
  "Sonia sent you while the situation is still mostly intact. What’s threatening to make that no longer true?",
  "Let’s interrupt this before it turns into one of those “everyone bloody knew” situations that nobody actually acted on. What did everyone know?",
  "You’re here before the clean-up crew, the questions, and the awkward silences. That’s rare. What’s going wrong?",
  "Sonia routed you here while this is still preventable, not just explainable. What needs stopping right now?",
  "This is the “say it now or explain it forever” phase of events. What would you warn a mate about if they were walking in?",
  "Sonia sent you before the fan, the shit, gravity, and probability all have strong opinions. Take your time — what’s coming?",
];
function hasSupportTrigger(text: string): boolean {
  const t = text.toLowerCase();
  const phrases = [
    // fear / distress
    "i'm scared", "im scared", "scared", "terrified", "frightened",
    "panic", "panicking", "anxious", "anxiety", "overwhelmed",
    "can't cope", "cannot cope", "i can't cope", "i cannot cope",
    "i can't do this", "i cannot do this",
    "crying", "shaking",
    "i'm not ok", "im not ok",

    // mental health
    "depressed", "depression", "mental health", "burnt out", "burned out",

    // alone / homesick / family
    "alone", "lonely", "isolated", "homesick",
    "missing my family", "miss my family", "missing family",

    // feeling unsafe
    "unsafe", "not safe", "i don't feel safe",
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

const FALLBACK_REPLY =
  "I’m with you. One line only — what’s hitting you hardest right now?";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const text = String(body?.text ?? "").trim();
    const force_support = Boolean(body?.force_support);

    if (!text) {
      // Return a usable support reply (don’t 400-loop the UI)
      return NextResponse.json({
        mode: "support",
        reply: FALLBACK_REPLY,
        follow_up_question: "",
      });
    }

    const support = force_support || hasSupportTrigger(text);

    if (!support) {
      // Not in support: tell caller clearly (client should route elsewhere)
      return NextResponse.json({ error: "Support not triggered" }, { status: 400 });
    }

    // If key missing, still return a usable support response (no hard failure)
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

You are Quill in SUPPORT MODE because the user is emotionally loaded or has opted to stay here for support.

Rules:
- No humour, no sarcasm.
- Brief validation (1–2 lines).
- 1–4 practical calming steps max (short).
- Ask ONE gentle question max.
- Do NOT mention incidents.

Schema:
{ "reply": string, "follow_up_question": string }

User text:
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