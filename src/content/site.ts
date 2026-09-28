export const navLinks = [
  { label: "Continuum", href: "#continuum" },
  { label: "Labs", href: "#labs" },
  { label: "Studio", href: "#studio" },
  { label: "Research", href: "#research" },
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
];

export type TimelineEntry = {
  title: string;
  summary: string;
  outputs: string[];
};

export const valueTimeline: TimelineEntry[] = [
  {
    title: "Problem",
    summary: "Every engagement starts with the problem, not a package.",
    outputs: ["What are you trying to solve?", "Who is affected, and how?", "What would “solved” look like?"],
  },
  {
    title: "Research",
    summary: "We understand the problem and the people inside it before committing to a solution.",
    outputs: ["Stakeholder & user interviews", "Systems and brand audit", "Research brief"],
  },
  {
    title: "Strategy",
    summary: "We decide what deserves to be built, and what does not.",
    outputs: ["Positioning & priorities", "Roadmap", "Success measures"],
  },
  {
    title: "Creative",
    summary: "Brand, interface and motion, shaped with the build in mind.",
    outputs: ["Identity & brand system", "UI/UX", "Art direction & motion"],
  },
  {
    title: "Technology",
    summary: "Software, platforms and systems built around the real problem.",
    outputs: ["Digital platforms", "AI & automation", "Data & architecture"],
  },
  {
    title: "Implementation",
    summary: "Shipped, adopted and measured. Then the work continues.",
    outputs: ["Launch & rollout", "Team handover", "Outcome tracking"],
  },
];

export const modelStages = [
  { name: "Research", body: "Understand the problem and the people inside it." },
  { name: "Discover", body: "Challenge assumptions. Find what deserves building." },
  { name: "Design", body: "Shape the solution: brand, interface, system." },
  { name: "Build", body: "Make it real: software, platforms, media." },
  { name: "Test", body: "Put it in the world and see what happens." },
  { name: "Learn", body: "Turn evidence into better questions." },
  { name: "Continue", body: "Feed what we learned into what comes next." },
];

export const fragmentation = [
  { role: "Strategy", loss: "Consultant A" },
  { role: "Agency", loss: "Brief re-written" },
  { role: "Designer", loss: "Files handed over" },
  { role: "Developer", loss: "Context lost" },
  { role: "Implementation", loss: "Who owns this?" },
];

export const connectedChain = ["Research", "Strategy", "Creative", "Technology", "Implementation", "Learning"];

export const benefits = [
  { title: "One connected team", body: "Less fragmentation between strategy, creative, technology and implementation." },
  { title: "From problem to implementation", body: "Don’t stop at recommendations. Move toward something that actually exists." },
  { title: "Research before assumptions", body: "Understand the problem before committing resources to a solution." },
  { title: "Build and test", body: "Put ideas into the real world and learn from what happens." },
  { title: "Capability that evolves", body: "Keep working together as the organization’s needs change." },
  { title: "Outcomes over activity", body: "Measure whether the work created change, not whether a deliverable shipped." },
];

/**
 * What clients say when they come to us, grouped by the kind of problem.
 * Feeds the "Who we work with" card ring — each statement is a card.
 */
export const audienceProblems: { tag: string; quotes: string[] }[] = [
  {
    tag: "Brand",
    quotes: [
      "We need to establish or reposition our brand.",
      "Our brand no longer matches who we are.",
      "We look smaller than we are.",
      "Nobody can explain what we do in one sentence.",
      "We've outgrown the identity we started with.",
      "Our brand feels different on every channel.",
      "We're launching something new and need it to land.",
      "We need a story people remember.",
    ],
  },
  {
    tag: "Platform",
    quotes: [
      "We need a digital platform.",
      "Our website can't do what the business needs.",
      "We want a client portal, not another spreadsheet.",
      "Our product needs to work on every device.",
      "We have users but no real product experience.",
      "We need to rebuild without losing what works.",
      "Our platform can't keep up with growth.",
      "We want customers to self-serve.",
    ],
  },
  {
    tag: "Systems",
    quotes: [
      "Our internal systems are holding us back.",
      "Everything lives in email and spreadsheets.",
      "Our tools don't talk to each other.",
      "Reporting takes days instead of minutes.",
      "We're doing by hand what software should do.",
      "We can't see where the work actually is.",
      "Onboarding a new team member takes weeks.",
      "We want to automate the repetitive work.",
    ],
  },
  {
    tag: "Discovery",
    quotes: [
      "We have an idea but don't know what to build.",
      "We're not sure the problem is the one we think it is.",
      "We need evidence before we spend the budget.",
      "Our users say one thing and do another.",
      "We don't know where to start.",
      "We need to test before we commit.",
      "We have too many ideas and no priorities.",
      "We need to understand our market properly.",
    ],
  },
  {
    tag: "Capability",
    quotes: [
      "We need technology and creative capability in the same process.",
      "Our agencies don't talk to each other.",
      "We need one team, not five vendors.",
      "Design and development keep undoing each other.",
      "We need a partner who stays after launch.",
      "We don't have the skills in-house yet.",
      "We need capability that grows with us.",
      "We want the people who researched it to build it.",
    ],
  },
  {
    tag: "Delivery",
    quotes: [
      "We need someone who can take the work beyond strategy.",
      "We have a strategy deck and nothing shipped.",
      "Projects keep stalling after the kickoff.",
      "We need it live, not just designed.",
      "Our last project ran over and under-delivered.",
      "We need a team that measures outcomes.",
      "We need to move faster without breaking things.",
      "We want to see progress every week.",
    ],
  },
];

export const nextSteps = [
  "We review the problem.",
  "We decide whether Continuity is a useful fit.",
  "We arrange a conversation.",
  "We define the next step.",
];

export const problemPlaceholders = [
  "Our internal systems are holding us back. We can’t see where effort is going…",
  "We need to reposition our brand before our next raise…",
  "We have an idea for a platform but don’t know what to build first…",
];

export const timelineOptions = ["As soon as possible", "Within 1–3 months", "3–6 months", "Just exploring"];
export const budgetOptions = ["Under R200k", "R200k – R1m", "R1m – R2.5m", "R2.5m+", "Not sure yet"];

export const footerColumns = [
  { title: "Products", links: [{ label: "Continuum", href: "#continuum" }] },
  {
    title: "Capabilities",
    links: [
      { label: "Labs", href: "#labs" },
      { label: "Studio", href: "#studio" },
      { label: "Research", href: "#research" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Work", href: "#work" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy.html" },
      { label: "Terms", href: "/terms.html" },
    ],
  },
  {
    title: "Connect",
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/company/continuityos-zar/" },
    ],
  },
];
