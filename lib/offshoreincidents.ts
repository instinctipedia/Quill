export type OffshoreIncident = {
    id: string;
    title: string;
    date: string; // ISO-ish or "DD Month YYYY"
    location: string;
    severity: number; // higher = more extreme
    hazardTags: string[]; // used for matching
    whatHappened: string;
    whyItMatters: string[];
    sourceUrl: string;
};

export const OFFSHORE_INCIDENTS: OffshoreIncident[] = [
    {
        id: "piper-alpha-1988",
        title: "Piper Alpha disaster (explosion & fire)",
        date: "6 July 1988",
        location: "North Sea (UK sector), ~120 miles NE of Aberdeen",
        severity: 100,
        hazardTags: [
            "hydrocarbon",
            "gas",
            "leak",
            "fire",
            "explosion",
            "permit",
            "handover",
            "isolation",
            "maintenance",
            "process",
            "pfeer",
            "major accident",
        ],
        whatHappened:
            "A catastrophic offshore installation explosion and fire led to the loss of 167 lives. The subsequent public inquiry drove fundamental changes in offshore safety management and control of major accident hazards.",
        whyItMatters: [
            "Major accident hazards offshore escalate fast: leaks + ignition + compromised barriers.",
            "Shift handover / isolation / permit-to-work failures can become fatal at system scale.",
            "Once control and emergency systems are impaired, people run out of options quickly.",
        ],
        sourceUrl: "https://www.hse.gov.uk/offshore/piper-alpha-disaster-public-inquiry.htm",
    },
    {
        id: "brent-charlie-hcr-2017",
        title: "Shell Brent Charlie: major hydrocarbon release in a confined leg",
        date: "19 May 2017",
        location: "Brent Charlie platform, North Sea",
        severity: 85,
        hazardTags: [
            "hydrocarbon",
            "gas",
            "release",
            "leak",
            "corrosion",
            "pipework",
            "confined space",
            "ventilation",
            "asphyxiation",
            "fire",
            "explosion",
            "pfeer",
            "major accident",
        ],
        whatHappened:
            "An uncontrolled release involved ~200kg of gas and ~1,550kg of crude oil inside a concrete leg column. HSE described it as the largest uncontrolled hydrocarbon release on the UK Continental Shelf reported to HSE in 2017, with potential catastrophic consequences if ignited.",
        whyItMatters: [
            "Confined spaces offshore can become unsurvivable quickly (asphyxiation + explosion risk).",
            "Temporary systems left in place can corrode and fail if not managed as safety-critical.",
            "Safety-critical ventilation and maintenance history matter when something goes wrong.",
        ],
        sourceUrl: "https://press.hse.gov.uk/2025/11/28/shell-uk-fined-560000-following-major-hydrocarbon-release/",
    },
    {
        id: "fpf1-lift-shaft-flooding-2020",
        title: "FPF-1: lift shaft flooding during descent (near drowning / entrapment risk)",
        date: "10 December 2020",
        location: "FPF-1 floating platform, North Sea",
        severity: 70,
        hazardTags: [
            "lift",
            "elevator",
            "shaft",
            "flooding",
            "water",
            "confined space",
            "entrapment",
            "night shift",
            "procedure",
            "alarm",
            "maintenance",
        ],
        whatHappened:
            "Three workers descended into a lift in a platform leg when water began flooding the shaft. The lift contacted water and they emergency-stopped and escaped. HSE described the outcome as only a matter of good fortune not becoming serious injury or worse.",
        whyItMatters: [
            "Entrapment + flooding + limited egress is a rapid escalation pathway offshore.",
            "Missing alarms and incorrect procedures remove the early warning you rely on.",
            "Night shift and task pressure increase the chance people proceed into a bad state.",
        ],
        sourceUrl: "https://press.hse.gov.uk/2025/06/17/oil-and-gas-operator-following-incident-on-north-sea-platform/",
    },
    {
        id: "rowan-gorilla-vii-crane-boom-collapse-2016",
        title: "Rowan Gorilla VII: offshore crane boom collapse (catastrophic near-miss)",
        date: "31 March 2016",
        location: "North Sea (offshore)",
        severity: 65,
        hazardTags: [
            "crane",
            "lifting",
            "boom",
            "collapse",
            "dropped object",
            "line of fire",
            "cement",
            "hose",
            "rig",
        ],
        whatHappened:
            "A crane boom collapsed catastrophically offshore; debris damaged a nearby vessel and a hose whipped and ruptured, releasing cement dust. Nobody was hurt, but HSE called it an “accident waiting to happen”.",
        whyItMatters: [
            "Lifting failures can turn into multi-person fatalities without warning.",
            "Flying debris + hose whip + loss of control = line-of-fire chaos.",
            "Near-misses offshore are often ‘missed by inches’ not ‘safe by design’.",
        ],
        sourceUrl: "https://press.hse.gov.uk/2023/12/21/offshore-drilling-company-fined-after-crane-boom-collapse/",
    },
];