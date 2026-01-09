"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type CaseItem = {
  title: string;
  date?: string;
  summary?: string;
  sourceUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
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

export default function GroundingClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const concern = sp.get("concern") || "";
  const moreCases = sp.get("more_cases") === "1";
  const explainLaw = sp.get("explain_law") === "1";

  const [draftConcern, setDraftConcern] = useState(concern);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GroundingResponse | null>(null);
  const [origin, setOrigin] = useState<HSEOrigin>("international");
  const [opener, setOpener] = useState<string | null>(null);

  useEffect(() => {
    setDraftConcern(concern);
  }, [concern]);

  useEffect(() => {
    setOpener("Let's get started with your concern.");
  }, []);

  useEffect(() => {
    if (!concern.trim()) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("concern", concern);
        if (moreCases) qs.set("more_cases", "1");
        if (explainLaw) qs.set("explain_law", "1");

        const res = await fetch(`/api/quill/grounding?${qs.toString()}`);
        const json = await res.json();

        if (res.ok) setData(json);
        else setData({ status: "error", error: "Failed to load grounding data." });
      } catch {
        setData({ status: "error", error: "Error fetching data." });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [concern, moreCases, explainLaw]);

  function setParam(key: string, value?: string) {
    const next = new URLSearchParams(sp.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.replace(`/quill/grounding?${next.toString()}`);
  }

  const visibleHSE =
    data?.hse?.filter((s) => s.origin === "guidance" || s.origin === origin) ?? [];

  return (
    <div style={{ maxWidth: 920, margin: "2rem auto", padding: "0 1rem" }}>
      <div style={{ border: "1px solid #ddd", borderRadius: 14, padding: "0.9rem", marginBottom: "0.75rem", background: "#fff" }}>
        <div style={{ fontWeight: 700 }}>
          {opener || "Nothing theoretical about this."}
        </div>
      </div>

      <h1 style={{ marginBottom: "0.75rem" }}>Onboard guidance</h1>

      <div style={{ border: "1px solid #ddd", borderRadius: 14, padding: "0.9rem", marginBottom: "1rem", background: "#fff" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>What are you dealing with?</div>
        <input
          type="text"
          value={draftConcern}
          onChange={(e) => setDraftConcern(e.target.value)}
          placeholder="e.g. ice on deck, fatigue, dropped object"
          style={{
            width: "100%",
            padding: "0.6rem 0.7rem",
            borderRadius: 8,
            border: "1px solid #ccc",
            fontSize: "0.95rem",
          }}
        />
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={() => setParam("concern", draftConcern.trim() || undefined)}
            disabled={!draftConcern.trim()}
          >
            Get guidance
          </button>
        </div>
      </div>

      {loading && <div style={{ padding: "1rem 0" }}>Loading guidance…</div>}

      {!loading && data?.status === "error" && (
        <div style={{ color: "#b00020", lineHeight: 1.5 }}>
          {data.error || "Something went wrong."}
        </div>
      )}

      {!loading && data?.cases?.length ? (
        <div style={{ marginTop: "1rem" }}>
          <h2 style={{ marginBottom: "0.75rem" }}>
            Representative offshore incidents &amp; patterns
          </h2>

          <div style={{ display: "grid", gap: "1rem" }}>
            {data.cases.map((c, idx) => (
              <div key={idx} style={{ border: "1px solid #ddd", borderRadius: 14, padding: "1rem", background: "#fff" }}>
                <div style={{ fontWeight: 800, marginBottom: "0.35rem" }}>Severity {c.severity}</div>
                <div style={{ fontWeight: 700 }}>{c.title}</div>
                {c.date && <div style={{ opacity: 0.8, marginBottom: "0.5rem" }}>{c.date}</div>}
                {c.imageUrl && (
                  <img
                    src={c.imageUrl}
                    alt={c.imageAlt || c.title}
                    style={{ width: "100%", borderRadius: 12, margin: "0.75rem 0" }}
                  />
                )}
                {c.summary && <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{c.summary}</div>}
                {c.sourceUrl && (
                  <div style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
                    Source:{" "}
                    <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                      {c.sourceUrl}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => setParam("more_cases", moreCases ? undefined : "1")}
            >
              {moreCases ? "Show fewer cases" : "More cases"}
            </button>
          </div>
        </div>
      ) : null}

      {!loading && visibleHSE.length ? (
        <div style={{ marginTop: "1.5rem" }}>
          <h2 style={{ marginBottom: "0.75rem" }}>Guidance, duties &amp; best practice</h2>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <div style={{ fontSize: "0.9rem", opacity: 0.8 }}>Legislation origin:</div>
            <select value={origin} onChange={(e) => setOrigin(e.target.value as HSEOrigin)}>
              <option value="international">International</option>
              <option value="uk">UK</option>
            </select>
          </div>

          <div style={{ display: "grid", gap: "1rem" }}>
            {visibleHSE.map((sec, i) => (
              <div key={i} style={{ border: "1px solid #ddd", borderRadius: 14, padding: "1rem", background: "#fff" }}>
                <div style={{ fontWeight: 800, marginBottom: "0.5rem" }}>{sec.title}</div>
                <div style={{ display: "grid", gap: "0.65rem" }}>
                  {sec.items.map((it, j) => (
                    <div key={j} style={{ lineHeight: 1.5 }}>
                      <div style={{ fontWeight: 700 }}>{it.name}</div>
                      {it.detail && <div style={{ color: "#333" }}>{it.detail}</div>}
                      {it.url && (
                        <div style={{ fontSize: "0.9rem" }}>
                          <a href={it.url} target="_blank" rel="noreferrer">
                            {it.url}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={() => setParam("explain_law", explainLaw ? undefined : "1")}
            >
              What does the legislation mean?
            </button>
          </div>
        </div>
      ) : null}

      {!loading && explainLaw && data?.explainLaw && (
        <div style={{ marginTop: "1.25rem", border: "1px solid #ddd", borderRadius: 14, padding: "1rem", background: "#fff" }}>
          <div style={{ fontWeight: 800, marginBottom: "0.5rem" }}>
            {data.explainLaw.title}
          </div>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
            {data.explainLaw.text}
          </div>
        </div>
      )}
    </div>
  );
}