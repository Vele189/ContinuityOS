// Lead notification email. Files starting with "_" in api/ aren't deployed as
// functions, so this is a plain module for contact.ts.
//
// Email clients are hostile to modern CSS: layout is tables, styles are inline,
// no web fonts, no CSS gradients (Outlook drops them). The spectrum bar is ten
// solid cells instead.
import { SPECTRUM, spread } from "../src/lib/spectrum.js";

export type Lead = {
  name: string;
  email: string;
  organization: string;
  problem: string;
  website?: string;
  timeline?: string;
  budget?: string;
};

// Public site, for the logo image and footer link. Override with SITE_URL if the domain changes.
const SITE_URL = (process.env.SITE_URL || "https://www.continuityos.co.za").replace(/\/$/, "");

const C = {
  canvas: "#010102",
  surface1: "#0f1011",
  surface2: "#141516",
  hairline: "#23252a",
  hairlineStrong: "#34343a",
  ink: "#f7f8f8",
  muted: "#d0d6e0",
  subtle: "#8a8f98",
  tertiary: "#80858d",
  accent: "#5e6ad2",
};
const FONT = "Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const MONO = "'Geist Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

const hex = ([r, g, b]: [number, number, number]) => `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
// Same order as the form's field colours, so each detail matches the field it came from
const FIELD = spread(7).map(hex);

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A clickable URL for the website field, or null if it doesn't look like one. */
function websiteHref(value: string) {
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

function receivedAt() {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

/** One detail row: coloured dot, label, value. `value` is already-escaped HTML. */
function detail(label: string, value: string, color: string) {
  return `
    <tr>
      <td style="padding:14px 0;border-top:1px solid ${C.hairline};width:136px;vertical-align:top;">
        <span style="display:inline-block;width:6px;height:6px;border-radius:3px;background:${color};vertical-align:middle;"></span>
        <span style="font-family:${MONO};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.tertiary};vertical-align:middle;padding-left:8px;">${label}</span>
      </td>
      <td style="padding:14px 0;border-top:1px solid ${C.hairline};font-family:${FONT};font-size:15px;line-height:1.5;color:${C.ink};vertical-align:top;">${value}</td>
    </tr>`;
}

/** A pill in a field's colour, for timeline and budget. */
function chip(value: string, color: string) {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;border:1px solid ${color};color:${color};font-family:${FONT};font-size:13px;line-height:1.4;">${escapeHtml(value)}</span>`;
}

export function renderLeadEmail(lead: Lead) {
  const name = escapeHtml(lead.name);
  const org = escapeHtml(lead.organization);
  const email = escapeHtml(lead.email);
  const firstName = escapeHtml(lead.name.split(/\s+/)[0] || lead.name);
  const replyHref = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(
    `Re: your conversation request with ContinuityOS`,
  )}`;
  const site = lead.website ? websiteHref(lead.website) : null;
  const when = receivedAt();

  const rows = [
    detail("Email", `<a href="mailto:${email}" style="color:${C.ink};text-decoration:none;">${email}</a>`, FIELD[1]),
    detail("Organization", org, FIELD[2]),
    lead.website &&
      detail(
        "Website",
        site
          ? `<a href="${escapeHtml(site)}" style="color:${C.ink};text-decoration:underline;text-decoration-color:${C.hairlineStrong};">${escapeHtml(lead.website)}</a>`
          : escapeHtml(lead.website),
        FIELD[4],
      ),
    lead.timeline && detail("Timeline", chip(lead.timeline, FIELD[5]), FIELD[5]),
    lead.budget && detail("Budget", chip(lead.budget, FIELD[6]), FIELD[6]),
  ]
    .filter(Boolean)
    .join("");

  const spectrumBar = SPECTRUM.map((c) => `<td style="height:4px;line-height:4px;font-size:0;background:${hex(c)};">&nbsp;</td>`).join("");

  // Shown as the inbox preview line after the subject
  const preheader = escapeHtml(lead.problem.replace(/\s+/g, " ").slice(0, 140));

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>New conversation request</title>
</head>
<body style="margin:0;padding:0;background:${C.canvas};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.canvas};">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.canvas};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

        <!-- Brand -->
        <tr>
          <td style="padding:0 4px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="vertical-align:middle;">
                  <img src="${SITE_URL}/apple-touch-icon.png" width="28" height="28" alt="" style="display:inline-block;vertical-align:middle;border-radius:6px;border:0;">
                  <span style="font-family:${FONT};font-size:16px;font-weight:600;color:${C.ink};vertical-align:middle;padding-left:8px;">ContinuityOS</span>
                </td>
                <td align="right" style="font-family:${MONO};font-size:11px;color:${C.tertiary};vertical-align:middle;">${when}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:${C.surface2};border:1px solid ${C.hairlineStrong};border-radius:16px;overflow:hidden;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${spectrumBar}</tr></table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:32px 32px 8px;">
                  <p style="margin:0 0 14px;font-family:${MONO};font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${FIELD[0]};">New conversation request</p>
                  <h1 style="margin:0;font-family:${FONT};font-size:28px;line-height:1.2;font-weight:600;letter-spacing:-0.5px;color:${C.ink};">${name}</h1>
                  <p style="margin:6px 0 0;font-family:${FONT};font-size:16px;line-height:1.5;color:${C.subtle};">${org}</p>
                </td>
              </tr>

              <!-- The problem -->
              <tr>
                <td style="padding:24px 32px 8px;">
                  <p style="margin:0 0 10px;font-family:${MONO};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${C.tertiary};">What they’re trying to solve</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="width:3px;background:${FIELD[3]};border-radius:2px;font-size:0;">&nbsp;</td>
                      <td style="padding:16px 20px;background:${C.surface1};border-radius:0 10px 10px 0;font-family:${FONT};font-size:16px;line-height:1.6;color:${C.muted};white-space:pre-wrap;">${escapeHtml(lead.problem)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Details -->
              <tr>
                <td style="padding:24px 32px 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
                </td>
              </tr>

              <!-- Reply -->
              <tr>
                <td style="padding:24px 32px 32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="border-radius:8px;background:${C.accent};">
                        <a href="${escapeHtml(replyHref)}" style="display:inline-block;padding:12px 22px;font-family:${FONT};font-size:14px;font-weight:500;color:#ffffff;text-decoration:none;border-radius:8px;">Reply to ${firstName} &rarr;</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:12px 0 0;font-family:${FONT};font-size:12px;line-height:1.5;color:${C.tertiary};">Or just hit reply: this email’s Reply-To is ${email}.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 4px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.tertiary};">
            Sent from the contact form on <a href="${SITE_URL}" style="color:${C.subtle};">${SITE_URL.replace(/^https?:\/\//, "")}</a>.<br>
            <span style="font-family:${FONT};font-style:italic;color:${C.subtle};">it simply continues</span>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  const text = [
    `New conversation request (${when})`,
    "",
    `${lead.name}, ${lead.organization}`,
    `Email: ${lead.email}`,
    lead.website && `Website: ${lead.website}`,
    lead.timeline && `Timeline: ${lead.timeline}`,
    lead.budget && `Budget: ${lead.budget}`,
    "",
    "What they're trying to solve:",
    lead.problem,
    "",
    "Reply to this email to answer them directly.",
  ]
    .filter((line): line is string => typeof line === "string")
    .join("\n");

  return { html, text };
}
