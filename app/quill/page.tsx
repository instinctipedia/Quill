import Link from "next/link";

export default function QuillPage() {
  return (
    <main style={{ maxWidth: 820, margin: "2rem auto", padding: "0 1rem", fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: "1rem" }}>Quill</h1>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <Link
          href="/report"
          style={{
            display: "inline-block",
            padding: "0.75rem 1rem",
            borderRadius: 12,
            border: "1px solid #ddd",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Anonymous Reporting
        </Link>

        <Link
          href="/quill/grounding"
          style={{
            display: "inline-block",
            padding: "0.75rem 1rem",
            borderRadius: 12,
            border: "1px solid #ddd",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Advisory Search
        </Link>
      </div>
    </main>
  );
}