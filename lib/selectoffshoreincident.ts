import { OFFSHORE_INCIDENTS, OffshoreIncident } from "./offshoreincidents";

function tokenize(s: string): string[] {
    return (s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
}

export function selectOffshoreIncident(concern: string): {
    incident: OffshoreIncident | null;
    matchedTags: string[];
} {
    const tokens = new Set(tokenize(concern));

    // Score each incident by number of matching hazardTags, tie-break by severity
    const scored = OFFSHORE_INCIDENTS.map((inc) => {
        const matched = inc.hazardTags.filter((t) => tokens.has(t));
        const score = matched.length;
        return { inc, score, matched };
    });

    // Require at least 1 tag match to claim relevance
    const relevant = scored.filter((x) => x.score > 0);

    if (relevant.length === 0) {
        return { incident: null, matchedTags: [] };
    }

    relevant.sort((a, b) => {
        // highest relevance score first
        if (b.score !== a.score) return b.score - a.score;
        // then most extreme
        return b.inc.severity - a.inc.severity;
    });

    return { incident: relevant[0].inc, matchedTags: relevant[0].matched };
}