import Link from "next/link";

export default function SupportPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Support</h1>
      <p>Support lives inside the Report chat for now.</p>
      <p style={{ marginTop: 12 }}>
        <Link href="/report">Go to Report</Link>
      </p>
    </main>
  );
}