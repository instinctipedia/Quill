"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

export default function GroundingClient() {
  const searchParams = useSearchParams();
  const concern = (searchParams.get("concern") || "").trim();

  return (
    <div style={{ padding: "2rem", maxWidth: 820, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        Grounding & HSE
      </h2>

      <p style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
        (Temporary) This page is loading correctly again. Next step: we re-insert your real grounding/HSE UI.
      </p>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: "0.9rem",
          background: "#fafafa",
          whiteSpace: "pre-wrap",
        }}
      >
        Concern: {concern || "(none provided)"}
      </div>
    </div>
  );
}