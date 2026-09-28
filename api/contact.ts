// .js extension: Vercel runs this as a native ES module, which needs full specifiers
import { budgetOptions, timelineOptions } from "../src/content/site.js";

type ContactPayload = {
  name?: string;
  email?: string;
  organization?: string;
  problem?: string;
  website?: string;
  timeline?: string;
  budget?: string;
};

// No whitespace, angle brackets, quotes or list separators, so it's safe as Reply-To
const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+$/;

const FIELDS = ["name", "email", "organization", "problem", "website", "timeline", "budget"] as const;

/** Longest accepted value per field. */
const MAX_LENGTH: Record<(typeof FIELDS)[number], number> = {
  name: 200,
  email: 254,
  organization: 200,
  problem: 5000,
  website: 500,
  timeline: 100,
  budget: 100,
};

/** Hidden field real visitors never see; bots that fill every input fill it too. */
const HONEYPOT = "company_url";

/** Forms submitted faster than this after render are treated as bots. */
const MIN_FILL_MS = 3000;

// Best-effort per-IP limit. Instances are reused between requests, so this
// stops a single script hammering the form; add a Vercel WAF rate-limit rule
// (or Turnstile) for a limit that holds across instances.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_MAX;
}

/** Control characters out, so values stay on one line in the subject. */
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const oneLine = (value: string) => value.replace(/[\x00-\x1f\x7f]+/g, " ").trim();

// Where leads go. Override with CONTACT_TO if it ever changes.
const DEFAULT_TO = "info@continuityos.co.za";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plain-text and HTML versions of the lead email. */
function renderEmail(body: Required<Pick<ContactPayload, "name" | "email" | "organization" | "problem">> & ContactPayload) {
  const rows: [string, string | undefined][] = [
    ["Name", body.name],
    ["Email", body.email],
    ["Organization", body.organization],
    ["Website", body.website],
    ["Timeline", body.timeline],
    ["Budget", body.budget],
  ];
  const filled = rows.filter(([, v]) => v?.trim());

  const text = [
    ...filled.map(([k, v]) => `${k}: ${v}`),
    "",
    "What they're trying to solve:",
    body.problem,
  ].join("\n");

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.5;color:#111">
      <h2 style="margin:0 0 16px">New conversation request</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        ${filled
          .map(
            ([k, v]) =>
              `<tr><td style="color:#666;padding-right:16px">${k}</td><td>${escapeHtml(v!)}</td></tr>`,
          )
          .join("")}
      </table>
      <h3 style="margin:24px 0 8px">What they're trying to solve</h3>
      <p style="white-space:pre-wrap;margin:0">${escapeHtml(body.problem)}</p>
    </div>`;

  return { text, html };
}

/**
 * Lead form endpoint. Validates the payload, then emails it to
 * info@continuityos.co.za via Resend (https://resend.com), with Reply-To set to
 * the sender so a reply goes straight to them.
 *
 * Env:
 *   RESEND_API_KEY  required — from the Resend dashboard
 *   CONTACT_FROM    required in production — a sender on a domain verified in
 *                   Resend, e.g. "ContinuityOS <website@continuityos.co.za>"
 *   CONTACT_TO      optional — defaults to info@continuityos.co.za
 */
export async function POST(request: Request) {
  // Requiring JSON forces a CORS preflight, so other sites can't post here with a simple form or no-cors fetch
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ error: "Expected JSON" }, { status: 415 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return Response.json({ error: "Too many messages. Please try again later." }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }
  const input = raw as Record<string, unknown>;

  // Bots: pretend it worked so they don't adapt
  const startedAt = Number(input.started_at);
  if (input[HONEYPOT] || (Number.isFinite(startedAt) && Date.now() - startedAt < MIN_FILL_MS)) {
    return Response.json({ ok: true });
  }

  const body: ContactPayload = {};
  for (const field of FIELDS) {
    const value = input[field];
    if (value === undefined || value === null || value === "") continue;
    if (typeof value !== "string") return Response.json({ error: `Invalid ${field}` }, { status: 400 });
    body[field] = value.trim();
  }

  const errors: Record<string, string> = {};
  if (!body.name) errors.name = "Please tell us your name.";
  if (!body.email || !EMAIL_RE.test(body.email)) errors.email = "Please enter a valid email.";
  if (!body.organization) errors.organization = "Please tell us where you work.";
  if (!body.problem) errors.problem = "Please describe the problem.";
  if (body.website && !/^https?:\/\/\S+$/i.test(body.website) && !/^[\w-]+(\.[\w-]+)+\S*$/.test(body.website)) {
    errors.website = "Please enter a valid web address.";
  }
  if (body.timeline && !timelineOptions.includes(body.timeline)) errors.timeline = "Please pick a timeline.";
  if (body.budget && !budgetOptions.includes(body.budget)) errors.budget = "Please pick a range.";
  for (const field of FIELDS) {
    if ((body[field]?.length ?? 0) > MAX_LENGTH[field]) {
      errors[field] = `Please keep this under ${MAX_LENGTH[field]} characters.`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 422 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[contact] RESEND_API_KEY is not set. Email not sent.");
    return Response.json({ error: "Email is not configured." }, { status: 500 });
  }

  const from = process.env.CONTACT_FROM;
  if (!from && process.env.VERCEL_ENV === "production") {
    console.error("[contact] CONTACT_FROM is not set; the Resend test sender only delivers to the account owner.");
  }

  const lead = body as Parameters<typeof renderEmail>[0];
  const { text, html } = renderEmail(lead);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      // onboarding@resend.dev only delivers to the Resend account's own address — set CONTACT_FROM for real use
      from: from || "ContinuityOS website <onboarding@resend.dev>",
      to: [process.env.CONTACT_TO || DEFAULT_TO],
      reply_to: lead.email,
      subject: `New conversation request: ${oneLine(lead.name)}, ${oneLine(lead.organization)}`.slice(0, 180),
      text,
      html,
    }),
  });

  if (!res.ok) {
    console.error("[contact] Resend error", res.status);
    return Response.json({ error: "Could not send your message." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
