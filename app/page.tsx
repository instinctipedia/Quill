"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Lang = "en" | "nl" | "de" | "pl" | "sv" | "fi";

const LANG_OPTIONS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "nl", label: "Nederlands (Dutch)" },
  { value: "de", label: "Deutsch (German)" },
  { value: "pl", label: "Polski (Polish)" },
  { value: "sv", label: "Svenska (Swedish)" },
  { value: "fi", label: "Suomi (Finnish)" },
];

const PREFS_KEY = "quill:prefs:v1";

function readPrefsLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return "en";
    const parsed = JSON.parse(raw);
    const lang = String(parsed?.lang || "en") as Lang;
    const allowed = new Set(LANG_OPTIONS.map((x) => x.value));
    return allowed.has(lang) ? lang : "en";
  } catch {
    return "en";
  }
}

function writePrefsLang(lang: Lang) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    const next = { ...existing, lang };
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    // If storage fails (private mode etc.), we just don't persist.
  }
}

export default function HomePage() {
  const router = useRouter();
  const [lang, setLang] = React.useState<Lang>("en");

  React.useEffect(() => {
    setLang(readPrefsLang());
  }, []);

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as Lang;
    setLang(next);
    writePrefsLang(next);
  }

function start() {
  writePrefsLang(lang);
  router.push(`/quill?lang=${encodeURIComponent(lang)}`);
}
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "#fff",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          border: "1px solid #e5e5e5",
          borderRadius: 14,
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "1.6rem", marginBottom: "0.75rem" }}>Quill</h1>

        <p style={{ lineHeight: 1.6, marginBottom: "1.25rem" }}>
          A human-first space to talk through safety, concern, and uncertainty —
          without judgement, pressure, or forms.
        </p>

        <p style={{ lineHeight: 1.6, marginBottom: "1.25rem", color: "#555" }}>
          You can raise a safety issue, ask a question, or just explain what’s going
          on. Anonymous by default.
        </p>

        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Language</div>
          <select
            value={lang}
            onChange={onChange}
            style={{
              width: "100%",
              padding: "0.6rem 0.75rem",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              fontSize: "1rem",
            }}
            aria-label="Language"
          >
            {LANG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <p style={{ marginTop: "0.75rem", lineHeight: 1.5, color: "#555" }}>
            Choose the language you’re most comfortable thinking in. Safety depends on
            understanding, not fluency.
            <br />
            If you’d rather use your language, that’s not “extra” — it’s safety-critical.
          </p>
        </div>

        <button
          onClick={start}
          style={{
            display: "inline-block",
            padding: "0.75rem 1.2rem",
            borderRadius: 10,
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Start a conversation
        </button>
      </div>
    </main>
  );
}