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

function pickOpener(): string {
  return QUILL_OPENERS[Math.floor(Math.random() * QUILL_OPENERS.length)];
}

/**
 * SUPPORT triggers (expanded as requested).
 * If any of these appear, we go to support-tone (OpenAI) on purpose.
 */
function triggersSupport(text: string): boolean {
  const t = text.toLowerCase();

  const cues = [
    // explicit distress
    "i'm scared",
    "im scared",
    "scared",
    "terrified",
    "panic",
    "panicking",
    "anxious",
    "anxiety",
    "overwhelmed",
    "can't cope",
    "cannot cope",
    "i can't cope",
    "i cannot cope",
    "i can't do this",
    "i cannot do this",
    "crying",
    "shaking",
    "i'm not ok",
    "im not ok",

    // expanded personal/support cues
    "insecure",
    "alone",
    "lonely",
    "first time offshore",
    "first time off shore",
    "first trip offshore",
    "new offshore",
    "depression",
    "depressed",
    "mental health",
    "mental-health",
    "suicidal", // (if they say it, we respond safely)
    "marriage",
    "divorce",
    "relationship",
    "missing my family",
    "miss my family",
    "homesick",
    "personal issue",
    "family issue",
  ];

  return cues.some((c) => t.includes(c));
}

function isVeryShort(text: string): boolean {
  return text.trim().length < 25;
}

function hasNoiseCue(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes("noise") ||
    t.includes("noisy") ||
    t.includes("loud") ||
    t.includes("screech") ||
    t.includes("whine") ||
    t.includes("vibration") ||
    t.includes("rattle")
  );
}

function hasSnapbackCue(text: string): boolean {
  const t = text.toLowerCase();
  const cues = ["snapback", "snap-back", "snap back", "bight", "under tension", "taut", "tight line", "line of fire"];
  return cues.some((c) => t.includes(c));
}

function hasWinchTuggerCue(text: string): boolean {
  const t = text.toLowerCase();
  const cues = ["winch", "tugger", "capstan", "heave", "hauling", "wire", "rope", "line", "cable", "chain"];
  return cues.some((c) => t.includes(c));
}

function deterministicClarify(text: string): { reply: string; follow_up_question: string } {
  const opener = pickOpener();
  const t = text.toLowerCase();

  // Keep it short. 1–2 questions. No corporate “acceptable level” stuff.
  if (isVeryShort(text)) {
    return {
      reply:
        `${opener}\n\n` +
        `Right — keep it simple. Give me ONE extra detail so I don’t guess wrong:\n` +
        `• What exactly is happening (1 line)?`,
      follow_up_question: "Example: “winch hauling in wire on deck, people near the bight”",
    };
  }

  if (hasNoiseCue(text)) {
    return {
      reply:
        `${opener}\n\n` +
        `Okay — noise.\n` +
        `Which bit is making it (winch/tugger/motor/gearbox), and where is it (deck/engine room/near bunks)?`,
      follow_up_question: "Is it continuous, or only under load?",
    };
  }

  if (hasSnapbackCue(text)) {
    return {
      reply:
        `${opener}\n\n` +
        `Snapback risk then.\n` +
        `Where’s the line under tension, and where are people standing right now (relative to the line)?`,
      follow_up_question: "Also: what’s missing — marking, barricade, or someone enforcing it?",
    };
  }

  if (hasWinchTuggerCue(text)) {
    return {
      reply:
        `${opener}\n\n` +
        `Right — winch/tugger situation.\n` +
        `What’s the task (hauling/lifting/positioning), and what’s the line/load doing (moving/static/under tension)?`,
      follow_up_question: "And what’s missing: marking/barricade/signage/toolbox talk/PTW?",
    };
  }

  // Default mechanical clarify
  return {
    reply:
      `${opener}\n\n` +
      `Right — keep it simple.\n` +
      `What’s the hazard (in 3–6 words), and where is it (exact location)?`,
    follow_up_question: "Example: “unguarded pinch point on hatch crane pedestal”",
  };
}

async function supportReply(text: string) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      reply:
        "I’ve got you. Quick check — are you safe right now and away from anything immediate?\n\n" +
        "If you are: tell me what’s making it feel heavy (one sentence). We can go slow.",
      follow_up_question: "Do you want comfort first, or a practical plan first?",
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
Return STRICT JSON ONLY.

You are Quill in SUPPORT MODE because the user is dealing with personal/emotional strain.

Rules:
- No humour, no sarcasm.
- Brief validation.
- 1–4 practical calming steps max.
- Invite them to keep talking.
- No incidents.
- No investigation pressure.

Schema:
{ "reply": string, "follow_up_question": string }

User text:
${text}
`.trim();

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return STRICT JSON ONLY. No markdown. No extra keys." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
  });

  const content = resp.choices[0]?.message?.content;
  if (!content) {
    return { reply: "I’m here. Say it in your own words — what’s going on?", follow_up_question: "One line is enough." };
  }

  try {
    const parsed = JSON.parse(content);
    return {
      reply: String(parsed?.reply ?? "").trim(),
      follow_up_question: String(parsed?.follow_up_question ?? "").trim(),
    };
  } catch {
    return {
      reply: "I’m here. Talk to me — what’s happening for you right now?",
      follow_up_question: "Do you want me to just listen, or help you plan your next step?",
    };
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok", note: "POST { text } to this route." });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "").trim();

    if (!text) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    // SUPPORT path (only when cues match)
    if (triggersSupport(text)) {
      const out = await supportReply(text);
      return NextResponse.json({ mode: "support", ...out });
    }

    // CLARIFY path (deterministic, Quill voice, short)
    const out = deterministicClarify(text);
    return NextResponse.json({ mode: "clarify", ...out });
  } catch (err) {
    console.error("❌ POST /api/quill/clarify crashed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}