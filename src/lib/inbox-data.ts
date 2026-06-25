// Hardcoded inbox of 10 workplace emails for the phishing-awareness training.
// Shared between client (renders the inbox) and server (scores submissions).
//
// `verdict` is the ground truth and is NEVER sent to the client raw — the
// client imports only the redacted shape via `getInboxClient()`.

export type EmailVerdict = "legitimate" | "suspicious" | "phishing";

export interface InboxEmail {
  id: string;
  sender_name: string;
  sender_email: string;
  to: string;
  subject: string;
  received_at: string; // e.g. "Today, 10:14 AM"
  body_html: string;
  attachments: { name: string; size: string; suspicious?: boolean }[];
  links: { text: string; href: string; suspicious?: boolean }[];
  // server-only:
  verdict: EmailVerdict;
  // when reported, these are the indicators the SOC team expects to see flagged
  expected_red_flags?: { id: string; label: string; explanation: string }[];
  // explanation for the learning report
  rationale: string;
}

export const INBOX_EMAILS: InboxEmail[] = [
  {
    id: "e1",
    sender_name: "Priya Menon — HR",
    sender_email: "priya.menon@nipun.com",
    to: "you@nipun.com",
    subject: "Reminder: Submit your timesheet by Friday",
    received_at: "Today, 9:02 AM",
    body_html: `<p>Hi team,</p><p>This is a friendly reminder to submit your timesheet for this week by Friday EOD in the HR portal. Reach out if you need any help.</p><p>Thanks,<br/>Priya</p>`,
    attachments: [],
    links: [{ text: "HR portal", href: "https://portal.nipun.com/timesheets" }],
    verdict: "legitimate",
    rationale: "Internal HR communication from the real domain, no urgency, no malicious link, no suspicious request.",
  },
  {
    id: "e2",
    sender_name: "IT Helpdesk",
    sender_email: "it-support@nipun-secure.net",
    to: "you@nipun.com",
    subject: "URGENT: Your mailbox quota is full — verify now",
    received_at: "Today, 9:18 AM",
    body_html: `<p>Dear User,</p><p>Your mailbox has exceeded 95% capacity. To avoid losing emails, <a href="https://nipun-secure.net/verify?u=you">click here to verify your credentials</a> within 24 hours.</p><p>IT Support</p>`,
    attachments: [],
    links: [{ text: "click here to verify your credentials", href: "https://nipun-secure.net/verify?u=you", suspicious: true }],
    verdict: "phishing",
    expected_red_flags: [
      { id: "lookalike_domain", label: "Look-alike sender domain (nipun-secure.net is not nipun.com)", explanation: "Attackers register domains that resemble your company's real one." },
      { id: "urgency", label: "Creates urgency / threatens loss of access", explanation: "Pressure is a classic social-engineering tactic." },
      { id: "credential_request", label: "Asks you to verify or re-enter credentials via a link", explanation: "Legitimate IT never asks for passwords by email." },
    ],
    rationale: "Credential-phishing: look-alike domain, urgency, link leading to a fake login.",
  },
  {
    id: "e3",
    sender_name: "Amazon",
    sender_email: "shipment-tracking@amazon.com",
    to: "you@nipun.com",
    subject: "Your order #112-9908-447 has shipped",
    received_at: "Yesterday, 6:41 PM",
    body_html: `<p>Hello,</p><p>Good news — your order has shipped and will arrive on Thursday. You can track it in your Amazon account.</p>`,
    attachments: [],
    links: [{ text: "Track in Amazon account", href: "https://www.amazon.com/orders" }],
    verdict: "legitimate",
    rationale: "Real consumer notification, sender domain matches, no credential request, no attachment.",
  },
  {
    id: "e4",
    sender_name: "Rajesh Kumar — CEO",
    sender_email: "rajesh.kumar@nipun-corp.co",
    to: "you@nipun.com",
    subject: "Quick task — are you available?",
    received_at: "Today, 10:03 AM",
    body_html: `<p>Hi,</p><p>Are you at your desk? I need you to quickly process a wire transfer for a confidential acquisition. Don't loop in finance yet — reply only to me.</p><p>Sent from my iPhone</p>`,
    attachments: [],
    links: [],
    verdict: "phishing",
    expected_red_flags: [
      { id: "ceo_impersonation", label: "CEO impersonation (Business Email Compromise)", explanation: "Attackers impersonate executives to bypass financial controls." },
      { id: "lookalike_domain", label: "Domain is nipun-corp.co, not nipun.com", explanation: "Tiny domain differences are the giveaway." },
      { id: "secrecy_request", label: "Demands secrecy and bypassing finance team", explanation: "Real executives don't ask you to bypass company policy." },
      { id: "urgency", label: "Creates urgency around a financial action", explanation: "Time pressure prevents you from verifying out-of-band." },
    ],
    rationale: "Classic BEC / CEO-fraud: spoofed executive, look-alike domain, secrecy, financial action.",
  },
  {
    id: "e5",
    sender_name: "Office 365 Calendar",
    sender_email: "noreply@nipun.com",
    to: "you@nipun.com",
    subject: "Reminder: All-hands meeting at 4:00 PM",
    received_at: "Today, 8:45 AM",
    body_html: `<p>This is your reminder for the all-hands meeting today at 4:00 PM in the main conference room. Agenda attached in the calendar invite.</p>`,
    attachments: [],
    links: [],
    verdict: "legitimate",
    rationale: "Internal calendar reminder, real domain, no action requested.",
  },
  {
    id: "e6",
    sender_name: "DocuSign",
    sender_email: "dse@nlpun.com",
    to: "you@nipun.com",
    subject: "You have a document to sign: Salary_Revision_2026.htm",
    received_at: "Yesterday, 4:12 PM",
    body_html: `<p>You have received a document to review and sign.</p><p>Please open the attachment to view and sign your salary revision letter.</p>`,
    attachments: [{ name: "Salary_Revision_2026.htm", size: "48 KB", suspicious: true }],
    links: [{ text: "Open document", href: "http://dse-nlpun.com/doc?id=99421", suspicious: true }],
    verdict: "phishing",
    expected_red_flags: [
      { id: "lookalike_domain", label: "Sender uses nlpun.com (lowercase L), not nipun.com", explanation: "Homoglyph attack." },
      { id: "html_attachment", label: "HTML attachment masquerading as a document", explanation: ".htm/.html attachments are a common phishing payload." },
      { id: "salary_bait", label: "Salary-related lure to encourage clicking", explanation: "Money-related subjects exploit curiosity." },
    ],
    rationale: "Phishing via HTML attachment from a look-alike domain — likely credential harvester.",
  },
  {
    id: "e7",
    sender_name: "LinkedIn",
    sender_email: "messages-noreply@linkedin.com",
    to: "you@nipun.com",
    subject: "You have 3 new connection requests",
    received_at: "Yesterday, 1:30 PM",
    body_html: `<p>You have 3 pending invitations to connect on LinkedIn.</p>`,
    attachments: [],
    links: [{ text: "See invitations", href: "https://www.linkedin.com/invitations" }],
    verdict: "legitimate",
    rationale: "Standard LinkedIn notification from the real domain.",
  },
  {
    id: "e8",
    sender_name: "Bank of Nipun",
    sender_email: "security-alert@bankofnipun-secure.com",
    to: "you@nipun.com",
    subject: "Unusual sign-in detected on your corporate card",
    received_at: "Today, 7:55 AM",
    body_html: `<p>Dear Customer,</p><p>We detected an unusual sign-in attempt from <b>Lagos, Nigeria</b>. If this was not you, <a href="http://bankofnipun-secure.com/confirm">confirm your identity immediately</a>.</p><p>Failure to do so will result in account suspension within 12 hours.</p>`,
    attachments: [],
    links: [{ text: "confirm your identity immediately", href: "http://bankofnipun-secure.com/confirm", suspicious: true }],
    verdict: "phishing",
    expected_red_flags: [
      { id: "lookalike_domain", label: "bankofnipun-secure.com is not your real bank domain", explanation: "Hyphenated look-alike domains are nearly always malicious." },
      { id: "urgency", label: "12-hour deadline / suspension threat", explanation: "Banks don't suspend accounts over email links." },
      { id: "scary_location", label: "Scary geo-location lure", explanation: "Designed to provoke a panic click." },
      { id: "http_link", label: "Link uses http:// (not https)", explanation: "Real banks never send unencrypted login links." },
    ],
    rationale: "Credential-phishing impersonating a bank; multiple urgency + look-alike domain cues.",
  },
  {
    id: "e9",
    sender_name: "Anita Sharma — Marketing",
    sender_email: "anita.sharma@nipun.com",
    to: "you@nipun.com",
    subject: "Final logo files for the campaign",
    received_at: "Yesterday, 11:08 AM",
    body_html: `<p>Hi,</p><p>Attached are the final logo files for the Q3 campaign. Let me know if you need other formats.</p><p>— Anita</p>`,
    attachments: [{ name: "nipun-logo-final.zip", size: "1.2 MB" }],
    links: [],
    verdict: "legitimate",
    rationale: "Expected internal collaboration, real domain, plausible attachment.",
  },
  {
    id: "e10",
    sender_name: "Microsoft Teams",
    sender_email: "noreply@teams.microsfot.com",
    to: "you@nipun.com",
    subject: "You missed a call from “HR_Onboarding”",
    received_at: "Today, 6:21 AM",
    body_html: `<p>You missed a call in Microsoft Teams. <a href="http://teams.microsfot.com/voicemail/abc">Listen to your voicemail</a> before it expires in 24 hours.</p>`,
    attachments: [],
    links: [{ text: "Listen to your voicemail", href: "http://teams.microsfot.com/voicemail/abc", suspicious: true }],
    verdict: "suspicious",
    expected_red_flags: [
      { id: "lookalike_domain", label: "microsfot.com (typo) is not microsoft.com", explanation: "Typosquatting domain." },
      { id: "voicemail_lure", label: "Voicemail lure with expiry", explanation: "Common phishing pattern to trick users into clicking." },
    ],
    rationale: "Likely phishing — typosquatted Microsoft domain with a voicemail lure.",
  },
];

// Redacted shape sent to the browser — strips verdicts/red-flag answers.
export function getInboxClient() {
  return INBOX_EMAILS.map(({ verdict, expected_red_flags, rationale, ...rest }) => rest);
}
export type InboxClientEmail = ReturnType<typeof getInboxClient>[number];
