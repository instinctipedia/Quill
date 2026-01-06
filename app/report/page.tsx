"use client";

import React from "react";

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

type Message = { role: "user" | "quill"; text: string };

function hasHazardCue(text: string): boolean {
  const t = text.toLowerCase();
  const cues = [
    "snapback",
    "snap-back",
    "snap back",
    "under tension",
    "tensioned",
    "tight line",
    "taut",
    "line of fire",
    "bight",
    "standing in the bight",
    "rope",
    "wire",
    "cable",
    "chain",
    "shackle",
    "tagline",
    "tugger",
    "winch",
    "snapback zone",
    "snapback zones",
    "unmarked",
    "no marking",
    "no signage",
    "no signs",
    "no barricade",
    "no barricades",
    "not barricaded",
    "exclusion zone",
    "no exclusion",
    "no demarcation",
    "not demarcated",
    "unguarded",
    "guard missing",
    "missing guard",
    "pinch point",
    "caught in",
    "trap point",
    "slip",
    "trip",
    "fall",
    "dropped object",
    "overhead",
    "working below",
  ];
  return cues.some((c) => t.includes(c));
}

function hasSupportCue(text: string): boolean {
  const t = text.toLowerCase();
  const cues = [
    "i'm scared",
    "im scared",
    "scared",
    "terrified",
    "frightened",
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
    "depressed",
    "depression",
    "mental health",
    "burnt out",
    "burned out",
    "alone",
    "lonely",
    "isolated",
    "homesick",
    "missing my family",
    "miss my family",
  ];
  return cues.some((c) => t.includes(c));
}

const PROGRESS_GATE_TEXT =
  "Before we go any further — I was just checking that you are OK.\n\n" +
  "The next step provides the reasons you SHOULD be concerned, and I don’t want to scare the shit out of you if you’re already carrying a lot.\n\n" +
  "If you're ready we can move forward. If not, we can keep talking here, this space is designed for your mental health support too, try me.";

const SUPPORT_FALLBACK =
  "I’m here. One line only — what’s hitting you hardest right now?";

export default function ReportPage() {
  const [opener, setOpener] = React.useState<string>("");
  const [concern, setConcern] = React.useState("");
  const [thread, setThread] = React.useState<Message[]>([]);
  const [showGate, setShowGate] = React.useState(false);
  const [pendingGroundConcern, setPendingGroundConcern] =
    React.useState<string>("");
  const [supportMode, setSupportMode] = React.useState(false);

  // ✅ hard latch: not subject to async state timing
  const supportLatchRef = React.useRef(false);

  React.useEffect(() => {
    const pick = QUILL_OPENERS[Math.floor(Math.random() * QUILL_OPENERS.length)];
    setOpener(pick);
  }, []);

  function push(role: Message["role"], text: string) {
    setThread((t) => [...t, { role, text }]);
  }

  // ✅ prevent repeated spam messages (especially fallback)
  function pushQuillOnce(text: string) {
    setThread((t) => {
      const last = t[t.length - 1];
      if (last?.role === "quill" && last.text === text) return t;
      return [...t, { role: "quill", text }];
    });
  }

  function latchSupportOn() {
    supportLatchRef.current = true;
    setSupportMode(true);
  }

  // ✅ key fix: pass force_support explicitly (don't rely on async state)
  async function callSupport(text: string, force_support: boolean) {
    try {
      const res = await fetch("/api/quill/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, force_support }),
      });

      const json = await res.json().catch(() => ({} as any));

      if (!res.ok || json?.error) {
        pushQuillOnce(SUPPORT_FALLBACK); // ✅ no spam loop
        return;
      }

      const reply = String(json?.reply ?? "").trim();
      const follow = String(json?.follow_up_question ?? "").trim();

      if (reply) push("quill", reply);
      if (follow) push("quill", follow);
    } catch {
      pushQuillOnce(SUPPORT_FALLBACK); // ✅ no spam loop
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const text = concern.trim();
    if (!text) return;

    // If the gate is showing, the user should use the buttons.
    // But do NOT hard-deadend the whole conversation logic.
    if (showGate) {
      pushQuillOnce("Use the buttons above — then we’ll continue.");
      return;
    }

    push("user", text);
    setConcern("");

    const forcedSupport = supportLatchRef.current || supportMode;

    // SUPPORT MODE STAYS ACTIVE (latch-based)
    if (forcedSupport) {
      await callSupport(text, true);
      return;
    }

    // EMOTIONAL TRIGGER → SUPPORT (latch immediately)
    if (hasSupportCue(text)) {
      latchSupportOn();
      await callSupport(text, true);
      return;
    }

    // DEFAULT: TREAT AS HSE → SHOW GATE
    push("quill", PROGRESS_GATE_TEXT);
    setPendingGroundConcern(text);
    setShowGate(true);
  }

  function onYesMoveForward() {
    const c = pendingGroundConcern.trim();
    if (!c) return;
    window.location.href = `/quill/grounding?concern=${encodeURIComponent(c)}`;
  }

  function onNoStayHere() {
    setShowGate(false);
    setPendingGroundConcern("");
    latchSupportOn();
    push("quill", "No problem. Stay here. Tell me what’s up — short is fine.");
  }

  return (
    <div style={{ maxWidth: 820, margin: "2rem auto", padding: "0 1rem" }}>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 14,
          padding: "1rem",
          marginBottom: "1rem",
          fontSize: "1.05rem",
          lineHeight: 1.45,
          fontWeight: 600,
          minHeight: 56,
        }}
      >
        {opener || "…"}
      </div>

      {thread.length > 0 && (
        <div style={{ marginBottom: "1rem", display: "grid", gap: "0.75rem" }}>
          {thread.map((m, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #ddd",
                borderRadius: 14,
                padding: "0.9rem",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                background: m.role === "quill" ? "#fafafa" : "#ffffff",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>
                {m.role === "quill" ? "Quill" : "You"}
              </div>
              {m.text}
            </div>
          ))}
        </div>
      )}

      {showGate && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <button type="button" onClick={onYesMoveForward}>
            Yes — move forward
          </button>
          <button type="button" onClick={onNoStayHere}>
            No — stay here and keep talking
          </button>
        </div>
      )}

      <form onSubmit={onSubmit}>
        <textarea
          value={concern}
          onChange={(e) => setConcern(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as any);
            }
          }}
          disabled={showGate}
          style={{
            width: "100%",
            height: 220,
            padding: "0.9rem",
            fontSize: "1rem",
            borderRadius: 14,
            border: "1px solid #ddd",
            lineHeight: 1.45,
            opacity: showGate ? 0.6 : 1,
          }}
          placeholder={showGate ? "Use the buttons above." : "Drop it here. Say it how you need to."}
        />

        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <button type="submit" disabled={showGate || !concern.trim()}>
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}