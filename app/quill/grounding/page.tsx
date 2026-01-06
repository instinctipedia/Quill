"use client";

export const dynamic = "force-dynamic";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";


type Incident = {
    title: string;
    date: string;
    what_happened: string;
    why_relevant: string[];
    source_url: string;
};

type LegislationItem = {
    title: string;
    why_it_applies: string;
    link: string;
};

type GroundingResponse =
    | { status: "ok"; incident: Incident; legislation: LegislationItem[] | null }
    | { status: "no_match"; incident: null; legislation: null }
    | { error: string };

export default function GroundingPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const concern = (searchParams.get("concern") || "").trim();

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState("");
    const [data, setData] = React.useState<GroundingResponse | null>(null);

    React.useEffect(() => {
        if (!concern) return;

        let cancelled = false;

        async function run() {
            setLoading(true);
            setError("");
            setData(null);

            try {
                const res = await fetch("/api/quill/grounding", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ concern }),
                });

                if (!res.ok) {
                    const payload = await res.json().catch(() => ({}));
                    throw new Error(payload?.error || "Grounding API call failed");
                }

                const json = (await res.json()) as GroundingResponse;

                if (!cancelled) setData(json);
            } catch (err: any) {
                if (!cancelled) setError(String(err?.message || err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        run();
        return () => {
            cancelled = true;
        };
    }, [concern]);

    function Card(props: { title: string; children: React.ReactNode }) {
        return (
            <div
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 14,
                    padding: "1rem",
                    marginBottom: "1rem",
                    background: "#fff",
                }}
            >
                <div style={{ fontWeight: 800, marginBottom: "0.5rem" }}>{props.title}</div>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{props.children}</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 920, margin: "2rem auto", padding: "0 1rem" }}>
            <div style={{ marginBottom: "1rem" }}>
                <button
                    type="button"
                    onClick={() => router.push("/report")}
                    style={{ marginRight: "0.75rem" }}
                >
                    Back to report
                </button>
            </div>

            <Card title="What you submitted">{concern ? concern : "No concern provided."}</Card>

            {loading && <Card title="Quill">Pulling the grounding incident + legal duties…</Card>}

            {error && <Card title="Error">{error}</Card>}

            {!loading && !error && data && "error" in data && <Card title="Error">{data.error}</Card>}

            {!loading && !error && data && !("error" in data) && data.status === "no_match" && (
                <Card title="Quill">
                    I can’t verify a single offshore fatal / life-altering incident for this concern right now.
                    {"\n\n"}
                    If you want, add one more line of detail (what task, what equipment, where people stand,
                    what’s under tension), then go back and resubmit.
                </Card>
            )}

            {!loading && !error && data && !("error" in data) && data.status === "ok" && data.incident && (
                <>
                    <Card title="Grounding incident (real-world)">
                        <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{data.incident.title}</div>
                        <div style={{ marginBottom: "0.75rem" }}>
                            <b>Date:</b> {data.incident.date}
                        </div>

                        <div style={{ marginBottom: "0.75rem" }}>
                            <b>What happened:</b>
                            <div style={{ marginTop: "0.35rem" }}>{data.incident.what_happened}</div>
                        </div>

                        <div style={{ marginBottom: "0.75rem" }}>
                            <b>Why this is relevant:</b>
                            <ul style={{ marginTop: "0.35rem" }}>
                                {(data.incident.why_relevant || []).map((x, i) => (
                                    <li key={i}>{x}</li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <b>Source:</b>{" "}
                            <a href={data.incident.source_url} target="_blank" rel="noreferrer">
                                {data.incident.source_url}
                            </a>
                        </div>
                    </Card>

                    <Card title="UK legal duties (HSE)">
                        {data.legislation && data.legislation.length > 0 ? (
                            <ul>
                                {data.legislation.map((l, i) => (
                                    <li key={i} style={{ marginBottom: "0.75rem" }}>
                                        <div style={{ fontWeight: 700 }}>{l.title}</div>
                                        <div style={{ margin: "0.25rem 0 0.25rem 0" }}>{l.why_it_applies}</div>
                                        <div>
                                            <a href={l.link} target="_blank" rel="noreferrer">
                                                {l.link}
                                            </a>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <>No legislation returned (yet). Re-run the flow once.</>
                        )}
                    </Card>

                    <Card title="Next step">
                        Reply in the comment box with one of these:
                        {"\n\n"}• <b>Help me raise this properly</b>
                        {"\n"}• <b>Advisory only</b>
                        {"\n"}• <b>Log only</b>
                    </Card>
                </>
            )}
        </div>
    );
}