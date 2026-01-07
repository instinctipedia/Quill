export default function HomePage() {
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
        <h1 style={{ fontSize: "1.6rem", marginBottom: "0.75rem" }}>
          Quill
        </h1>

        <p style={{ lineHeight: 1.6, marginBottom: "1.25rem" }}>
          A human-first space to talk through safety, concern, and uncertainty —
          without judgement, pressure, or forms.
        </p>

        <p style={{ lineHeight: 1.6, marginBottom: "1.5rem", color: "#555" }}>
          You can raise a safety issue, ask a question, or just explain what’s
          going on. Anonymous by default.
        </p>

        <a
          href="/report"
          style={{
            display: "inline-block",
            padding: "0.6rem 1.1rem",
            borderRadius: 8,
            background: "#111",
            color: "#fff",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          Start a conversation
        </a>
      </div>
    </main>
  );
}