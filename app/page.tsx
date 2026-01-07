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

        {/* Language respect signal */}
        <div style={{ marginBottom: "1.25rem", fontSize: "0.9rem", color: "#444" }}>
          <strong>Language</strong>

          <div style={{ marginTop: "0.35rem" }}>
            <select
              disabled
              style={{
                padding: "0.4rem",
                borderRadius: 6,
                border: "1px solid #ccc",
                background: "#f9f9f9",
              }}
            >
              <option>English</option>

              <option>Deutsch (coming soon)</option>
              <option>Nederlands (coming soon)</option>
              <option>Suomi (coming soon)</option>
              <option>Svenska (coming soon)</option>
              <option>Polski (coming soon)</option>

              <option>ไทย / Thai (coming soon)</option>
              <option>Filipino / Tagalog (coming soon)</option>
              <option>Tiếng Việt / Vietnamese (coming soon)</option>

              <option>Español (coming soon)</option>
              <option>Français (coming soon)</option>
              <option>Português (coming soon)</option>
              <option>Italiano (coming soon)</option>

              <option>العربية / Arabic (coming soon)</option>
              <option>Bahasa Indonesia (coming soon)</option>
              <option>Bahasa Melayu (coming soon)</option>

              <option>हिन्दी / Hindi (coming soon)</option>
              <option>தமிழ் / Tamil (coming soon)</option>
            </select>
          </div>

          <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#666" }}>
            Choose the language you’re most comfortable thinking in.
            Safety depends on understanding, not fluency.
          </div>

          <div style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "#666" }}>
            If you’d rather use your language, that’s not “extra” — it’s safety-critical.
          </div>
        </div>

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
