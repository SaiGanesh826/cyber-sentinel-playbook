// Hardcoded inbox of 10 workplace emails for the Training module
// (inbox-investigation scenario). Shared between client and server.
//
// `verdict` is the ground truth and is NEVER sent to the client raw — the
// client imports only the redacted shape via `getInboxClient()`.
//
// Design goals:
//  - Emails LOOK like real Outlook/Gmail messages: professional formatting,
//    signatures, logos, action buttons, attachments.
//  - Hyperlinks are HIDDEN: the visible text is friendly ("View Document",
//    "Reset Password"), while the real `href` may point to a look-alike
//    domain. The employee must hover/inspect to discover the truth.
//  - Some phishing emails look highly convincing; some legitimate emails
//    look slightly suspicious. The goal is investigation, not pattern-matching.

export type EmailVerdict = "legitimate" | "suspicious" | "phishing";

export interface InboxEmail {
  id: string;
  sender_name: string;
  sender_email: string;
  to: string;
  subject: string;
  received_at: string;
  body_html: string;
  attachments: { name: string; size: string; suspicious?: boolean }[];
  links: { text: string; href: string; suspicious?: boolean }[];
  // server-only:
  verdict: EmailVerdict;
  expected_red_flags?: { id: string; label: string; explanation: string }[];
  rationale: string;
}

// ---------- shared HTML helpers (inline styles so emails look like real mail) ----------

const FONT = `font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color:#202124; font-size:14px; line-height:1.55;`;

function btn(text: string, href: string, color = "#0067b8") {
  return `<a href="${href}" style="display:inline-block;background:${color};color:#ffffff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;letter-spacing:.2px;">${text}</a>`;
}

function signature(opts: {
  name: string;
  title: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  websiteHref?: string;
  logoUrl?: string;
}) {
  const {
    name,
    title,
    company = "Nipun Technologies Pvt. Ltd.",
    email,
    phone,
    website = "www.nipun.com",
    websiteHref = "https://www.nipun.com",
    logoUrl,
  } = opts;
  return `
    <table cellpadding="0" cellspacing="0" style="border-top:1px solid #e0e0e0; margin-top:18px; padding-top:12px; font-size:12px; color:#5f6368; ${FONT}">
      <tr>
        ${
          logoUrl
            ? `<td style="padding-right:14px; vertical-align:top;"><img src="${logoUrl}" alt="${company}" width="56" style="display:block;border-radius:6px;"/></td>`
            : ""
        }
        <td style="vertical-align:top;">
          <div style="font-weight:600; color:#202124; font-size:13px;">${name}</div>
          <div style="color:#5f6368;">${title} · ${company}</div>
          ${email ? `<div style="margin-top:4px;">✉ <a href="mailto:${email}" style="color:#5f6368; text-decoration:none;">${email}</a></div>` : ""}
          ${phone ? `<div>☎ ${phone}</div>` : ""}
          <div>🌐 <a href="${websiteHref}" style="color:#1a73e8; text-decoration:none;">${website}</a></div>
        </td>
      </tr>
    </table>`;
}

function confidentiality() {
  return `<p style="margin-top:14px;font-size:10.5px;color:#9aa0a6;line-height:1.4;">This email and any attachments are confidential and intended solely for the addressee. If you have received this message in error, please notify the sender and delete it from your system.</p>`;
}

// ---------- the 10 emails ----------

export const INBOX_EMAILS: InboxEmail[] = [
  // 1. LEGITIMATE — HR timesheet reminder (looks normal)
  {
    id: "e1",
    sender_name: "Priya Menon",
    sender_email: "priya.menon@nipun.com",
    to: "you@nipun.com",
    subject: "Reminder: Submit your timesheet by Friday 6:00 PM",
    received_at: "Today, 9:02 AM",
    body_html: `
      <div style="${FONT}">
        <p>Hi team,</p>
        <p>This is your weekly reminder to submit your timesheet in Workday by <b>Friday, 6:00 PM IST</b>. Late submissions delay payroll for the entire department, so please don't miss the deadline.</p>
        <p>You can find a short how-to guide in the HR knowledge base if you're new to the process.</p>
        <p style="margin:22px 0;">
          ${btn("Open Workday Timesheet", "https://workday.nipun.com/timesheets")}
        </p>
        <p>Reach out if you need any help.</p>
        <p>Best regards,<br/>Priya</p>
        ${signature({
          name: "Priya Menon",
          title: "People Operations Lead",
          email: "priya.menon@nipun.com",
          phone: "+91 80 4000 1200",
        })}
        ${confidentiality()}
      </div>`,
    attachments: [],
    links: [
      { text: "Open Workday Timesheet", href: "https://workday.nipun.com/timesheets" },
    ],
    verdict: "legitimate",
    rationale:
      "Internal HR communication from the real corporate domain (nipun.com). Link text and destination domain match. No credential request, no unusual urgency.",
  },

  // 2. PHISHING — Mailbox quota with hidden link to look-alike domain
  {
    id: "e2",
    sender_name: "Microsoft 365 Support",
    sender_email: "no-reply@microsoft-365-alerts.com",
    to: "you@nipun.com",
    subject: "Action required: Your mailbox storage is 98% full",
    received_at: "Today, 9:18 AM",
    body_html: `
      <div style="${FONT}">
        <table cellpadding="0" cellspacing="0" style="width:100%; background:#f3f3f3; padding:14px 0; border-bottom:3px solid #0067b8;">
          <tr><td style="padding:0 22px;">
            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" width="120" alt="Microsoft" style="display:block;"/>
          </td></tr>
        </table>
        <div style="padding:24px;">
          <h2 style="margin:0 0 14px 0; font-weight:600; color:#201f1e;">Your mailbox is almost full</h2>
          <p>Dear user,</p>
          <p>Our records show that your mailbox <b>you@nipun.com</b> has reached <b>98% of its storage limit</b>. To continue sending and receiving messages without interruption, please verify your account to receive an additional <b>5&nbsp;GB</b> of storage at no cost.</p>
          <p>This verification request will <b>expire in 24 hours</b>.</p>
          <p style="margin:26px 0;">
            ${btn("Verify Account &amp; Add Storage", "https://login-microsoftonline.secure-verify365.com/auth")}
          </p>
          <p>If you do not complete verification, your account may be temporarily suspended.</p>
          <p style="margin-top:22px;">Thank you,<br/>The Microsoft 365 Team</p>
          <p style="margin-top:22px; font-size:11px; color:#605e5c;">© 2026 Microsoft Corporation. One Microsoft Way, Redmond, WA 98052.</p>
        </div>
      </div>`,
    attachments: [],
    links: [
      {
        text: "Verify Account & Add Storage",
        href: "https://login-microsoftonline.secure-verify365.com/auth",
        suspicious: true,
      },
    ],
    verdict: "phishing",
    expected_red_flags: [
      { id: "lookalike_domain", label: "Sender domain is microsoft-365-alerts.com, not microsoft.com", explanation: "Microsoft never sends real account notifications from third-party look-alike domains." },
      { id: "urgency", label: "Artificial 24-hour deadline / threat of suspension", explanation: "Pressure tactics are a classic social-engineering signal." },
      { id: "credential_request", label: "Button links to a fake login page", explanation: "Hovering reveals secure-verify365.com — not a Microsoft domain. Real Microsoft links go to *.microsoft.com or *.live.com." },
      { id: "generic_greeting", label: "Generic greeting (\"Dear user\")", explanation: "Legitimate provider mail addresses you by name." },
    ],
    rationale:
      "Credential-harvesting phishing dressed up as Microsoft 365. Branding looks legitimate but the sender domain and the link destination both reveal the attack.",
  },

  // 3. LEGITIMATE — Amazon shipment (a bit terse, but real)
  {
    id: "e3",
    sender_name: "Amazon.in",
    sender_email: "shipment-tracking@amazon.in",
    to: "you@nipun.com",
    subject: "Your Amazon.in order has shipped (#403-2918-1140)",
    received_at: "Yesterday, 6:41 PM",
    body_html: `
      <div style="${FONT}">
        <div style="background:#232f3e; padding:14px 20px;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" width="100" alt="Amazon" style="display:block;"/>
        </div>
        <div style="padding:22px;">
          <h3 style="margin:0 0 10px 0;">Your package is on the way</h3>
          <p>Hello, your order <b>#403-2918-1140</b> has shipped and is expected to arrive on <b>Thursday, 27 Jun</b>.</p>
          <table cellpadding="0" cellspacing="0" style="margin:14px 0; border:1px solid #eee; padding:12px; width:100%;">
            <tr>
              <td style="padding:8px; width:80px;"><div style="width:64px;height:64px;background:#f2f2f2;border-radius:6px;display:inline-block;"></div></td>
              <td style="padding:8px; vertical-align:top;">
                <div style="font-weight:600;">Logitech MX Master 3S</div>
                <div style="color:#565959; font-size:12px;">Qty: 1 · Sold by Cloudtail India</div>
              </td>
            </tr>
          </table>
          <p style="margin:22px 0;">${btn("Track Package", "https://www.amazon.in/gp/your-account/order-details?orderID=403-2918-1140", "#febd69")}</p>
          <p style="font-size:12px; color:#565959;">We hope to see you again soon.<br/>Amazon.in</p>
        </div>
      </div>`,
    attachments: [],
    links: [
      {
        text: "Track Package",
        href: "https://www.amazon.in/gp/your-account/order-details?orderID=403-2918-1140",
      },
    ],
    verdict: "legitimate",
    rationale:
      "Genuine shipment notification — sender domain matches Amazon and the tracking link points to amazon.in. No credentials requested.",
  },

  // 4. PHISHING — BEC / CEO impersonation (very convincing)
  {
    id: "e4",
    sender_name: "Rajesh Kumar",
    sender_email: "rajesh.kumar@nipun-corp.co",
    to: "you@nipun.com",
    subject: "Quick favour — are you at your desk?",
    received_at: "Today, 10:03 AM",
    body_html: `
      <div style="${FONT}">
        <p>Hi,</p>
        <p>Are you free for the next 15 minutes? I'm in back-to-back meetings and need someone to help me close a confidential acquisition payment today.</p>
        <p>Please reply only to this email — don't loop in finance yet, the deal hasn't been announced. I'll send the vendor's bank details and the amount once you confirm.</p>
        <p>Thanks,<br/>Rajesh</p>
        <p style="margin-top:20px; color:#5f6368; font-size:12px;">
          Sent from my iPhone
        </p>
      </div>`,
    attachments: [],
    links: [],
    verdict: "phishing",
    expected_red_flags: [
      { id: "ceo_impersonation", label: "Executive impersonation (Business Email Compromise)", explanation: "Attackers spoof the CEO to bypass financial controls." },
      { id: "lookalike_domain", label: "Domain is nipun-corp.co, not nipun.com", explanation: "Tiny domain differences are the giveaway." },
      { id: "secrecy_request", label: "Demands secrecy / asks you to bypass finance", explanation: "Real executives don't ask you to skip controls." },
      { id: "urgency", label: "Time-pressure around a financial action", explanation: "Urgency prevents out-of-band verification." },
    ],
    rationale:
      "Classic BEC / CEO-fraud. No link, no attachment — pure social engineering. The look-alike sender domain and request for secrecy are the only tells.",
  },

  // 5. LEGITIMATE — Office 365 calendar (slightly bland, looks like spam at a glance)
  {
    id: "e5",
    sender_name: "Microsoft Outlook",
    sender_email: "calendar-noreply@nipun.com",
    to: "you@nipun.com",
    subject: "Reminder: Quarterly All-Hands — Today at 4:00 PM",
    received_at: "Today, 8:45 AM",
    body_html: `
      <div style="${FONT}">
        <div style="border-left:4px solid #0067b8; background:#f3f9ff; padding:14px 18px;">
          <div style="font-weight:600; color:#0067b8;">Quarterly All-Hands</div>
          <div style="color:#5f6368; font-size:12px; margin-top:2px;">Today · 4:00 PM – 5:00 PM IST · Main Conference Room / Teams</div>
        </div>
        <p style="margin-top:18px;">Hello,</p>
        <p>This is a reminder that the <b>Q2 All-Hands</b> begins in your calendar today at 4:00 PM. The agenda and supporting decks are attached to the meeting invite in Outlook.</p>
        <p>If you cannot attend, please RSVP from the original invite — do not reply to this automated reminder.</p>
        <p style="margin-top:18px; font-size:12px; color:#5f6368;">— Microsoft Outlook on behalf of Nipun Internal Communications</p>
      </div>`,
    attachments: [],
    links: [],
    verdict: "legitimate",
    rationale:
      "Internal calendar reminder from the real corporate domain. No action, no link, no attachment. Slightly bland but legitimate.",
  },

  // 6. PHISHING — DocuSign salary letter with malicious attachment + hidden link
  {
    id: "e6",
    sender_name: "DocuSign Electronic Signature Service",
    sender_email: "dse_NA1@docusign.net.sign-portal.com",
    to: "you@nipun.com",
    subject: "Completed: \"Salary Revision — FY 2026.pdf\" is ready for your signature",
    received_at: "Yesterday, 4:12 PM",
    body_html: `
      <div style="${FONT}">
        <div style="background:#ffffff; border-top:6px solid #f7b500; padding:24px;">
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/DocuSign_logo.png" width="120" alt="DocuSign" style="display:block; margin-bottom:18px;"/>
          <h3 style="margin:0 0 8px 0;">Priya Menon sent you a document to review and sign</h3>
          <table cellpadding="0" cellspacing="0" style="margin:14px 0; padding:12px; background:#fafafa; border:1px solid #eee;">
            <tr>
              <td style="padding-right:14px;"><div style="width:40px;height:48px;background:#e8b923;border-radius:2px;display:inline-block;text-align:center;color:white;font-weight:700;line-height:48px;">PDF</div></td>
              <td>
                <div style="font-weight:600;">Salary Revision — FY 2026.pdf</div>
                <div style="font-size:12px;color:#5f6368;">1 document · 1 page</div>
              </td>
            </tr>
          </table>
          <p>Please review and sign at your earliest convenience.</p>
          <p style="margin:24px 0;">${btn("REVIEW DOCUMENT", "http://docusign-sign.nlpun-corp.com/d/?id=99421", "#f7b500")}</p>
          <p style="font-size:12px; color:#5f6368;">If you have trouble signing, hover over the button above or contact your sender.</p>
          <p style="font-size:11px; color:#9aa0a6; margin-top:20px;">Do Not Share This Email — This email contains a secure link to DocuSign. Please do not share this email, link, or access code with others.</p>
        </div>
      </div>`,
    attachments: [
      { name: "Salary_Revision_FY2026.htm", size: "48 KB", suspicious: true },
    ],
    links: [
      {
        text: "REVIEW DOCUMENT",
        href: "http://docusign-sign.nlpun-corp.com/d/?id=99421",
        suspicious: true,
      },
    ],
    verdict: "phishing",
    expected_red_flags: [
      { id: "lookalike_domain", label: "Sender uses sign-portal.com, link points to nlpun-corp.com (homoglyph)", explanation: "Real DocuSign messages come from docusign.net only." },
      { id: "html_attachment", label: ".htm attachment masquerading as a PDF", explanation: "HTML attachments are a common credential-harvester payload." },
      { id: "salary_bait", label: "Money/salary lure to encourage clicking", explanation: "Salary-related subjects exploit curiosity and emotion." },
      { id: "http_link", label: "Link uses http:// instead of https://", explanation: "DocuSign never sends unencrypted links." },
    ],
    rationale:
      "Highly convincing DocuSign clone. Branding is correct, but the sender domain, the attachment extension, and the link destination all give it away.",
  },

  // 7. LEGITIMATE — LinkedIn invitations
  {
    id: "e7",
    sender_name: "LinkedIn",
    sender_email: "messages-noreply@linkedin.com",
    to: "you@nipun.com",
    subject: "You have 3 new invitations",
    received_at: "Yesterday, 1:30 PM",
    body_html: `
      <div style="${FONT}">
        <div style="background:#0a66c2; padding:14px 22px;">
          <span style="color:white;font-weight:600;font-size:18px;">Linked<span style="background:white;color:#0a66c2;padding:0 4px;border-radius:2px;">in</span></span>
        </div>
        <div style="padding:22px;">
          <h3 style="margin:0 0 12px 0;">You have 3 pending invitations</h3>
          <ul style="padding-left:18px; color:#262626;">
            <li>Anita S. — Marketing Director at Wipro</li>
            <li>Karan M. — Security Engineer at Razorpay</li>
            <li>Meera J. — Recruiter at Microsoft</li>
          </ul>
          <p style="margin:22px 0;">${btn("See all invitations", "https://www.linkedin.com/mynetwork/invitation-manager/", "#0a66c2")}</p>
          <p style="font-size:11px; color:#666;">You are receiving Invitation emails. Unsubscribe.</p>
        </div>
      </div>`,
    attachments: [],
    links: [
      {
        text: "See all invitations",
        href: "https://www.linkedin.com/mynetwork/invitation-manager/",
      },
    ],
    verdict: "legitimate",
    rationale:
      "Standard LinkedIn notification. Sender and link both belong to linkedin.com.",
  },

  // 8. PHISHING — Bank security alert with hidden link
  {
    id: "e8",
    sender_name: "HDFC Bank Online Banking",
    sender_email: "alerts@hdfcbank-secure-services.com",
    to: "you@nipun.com",
    subject: "Security alert: Unusual sign-in detected on your NetBanking account",
    received_at: "Today, 7:55 AM",
    body_html: `
      <div style="${FONT}">
        <div style="background:#004C8F; padding:14px 22px;">
          <span style="color:white;font-weight:700;font-size:18px;letter-spacing:.5px;">HDFC BANK</span>
        </div>
        <div style="padding:22px;">
          <p>Dear Customer,</p>
          <p>We detected a sign-in attempt to your NetBanking account from a new device:</p>
          <table style="margin:8px 0 14px 0; font-size:13px; color:#202124;">
            <tr><td style="padding:2px 14px 2px 0; color:#5f6368;">Device:</td><td>Windows · Chrome 126</td></tr>
            <tr><td style="padding:2px 14px 2px 0; color:#5f6368;">Location:</td><td>Lagos, Nigeria</td></tr>
            <tr><td style="padding:2px 14px 2px 0; color:#5f6368;">Time:</td><td>Today, 7:48 AM IST</td></tr>
          </table>
          <p>If this <b>wasn't you</b>, secure your account immediately. Otherwise, your NetBanking access will be temporarily suspended within <b>12 hours</b> as a precaution.</p>
          <p style="margin:22px 0;">${btn("Secure My Account", "http://hdfcbank-secure-services.com/netbanking/confirm", "#cc0000")}</p>
          <p style="font-size:11px; color:#5f6368;">Never share your customer ID, password or OTP with anyone — including HDFC Bank staff.</p>
        </div>
      </div>`,
    attachments: [],
    links: [
      {
        text: "Secure My Account",
        href: "http://hdfcbank-secure-services.com/netbanking/confirm",
        suspicious: true,
      },
    ],
    verdict: "phishing",
    expected_red_flags: [
      { id: "lookalike_domain", label: "hdfcbank-secure-services.com is not the real bank domain", explanation: "HDFC NetBanking lives on hdfcbank.com only — hyphenated look-alikes are nearly always malicious." },
      { id: "urgency", label: "12-hour deadline / threat of suspension", explanation: "Banks don't suspend accounts via email links." },
      { id: "scary_location", label: "Scary geo-location lure (\"Lagos, Nigeria\")", explanation: "Designed to provoke a panic click." },
      { id: "http_link", label: "Link uses http:// — never used by real banks", explanation: "Real banks never send unencrypted login links." },
      { id: "generic_greeting", label: "Generic \"Dear Customer\" greeting", explanation: "Your real bank knows your name." },
    ],
    rationale:
      "Credential-phishing impersonating a major Indian bank. Visual branding is close, but multiple cues — domain, http://, urgency, generic greeting — reveal the attack.",
  },

  // 9. LEGITIMATE — internal colleague with ZIP (but slightly suspicious if you're not careful)
  {
    id: "e9",
    sender_name: "Anita Sharma",
    sender_email: "anita.sharma@nipun.com",
    to: "you@nipun.com",
    subject: "Re: Q3 campaign — final logo files attached",
    received_at: "Yesterday, 11:08 AM",
    body_html: `
      <div style="${FONT}">
        <p>Hey,</p>
        <p>As discussed in yesterday's standup, attaching the final logo pack for the Q3 campaign — includes the dark, light and monochrome variants in SVG, PNG and EPS.</p>
        <p>Let me know if you need anything resized or in a different format.</p>
        <p>Thanks,<br/>Anita</p>
        ${signature({
          name: "Anita Sharma",
          title: "Senior Designer — Brand Marketing",
          email: "anita.sharma@nipun.com",
          phone: "+91 98 1234 5678",
        })}
      </div>`,
    attachments: [{ name: "Nipun_Q3_Logo_Pack_Final.zip", size: "1.2 MB" }],
    links: [],
    verdict: "legitimate",
    rationale:
      "Expected internal collaboration from the real domain. ZIP attachment is plausible for a designer sharing multiple assets. Reporting this as phishing is a false alarm.",
  },

  // 10. SUSPICIOUS — Microsoft Teams voicemail (typosquatted, may not be true phishing)
  {
    id: "e10",
    sender_name: "Microsoft Teams",
    sender_email: "noreply@teams.microsfot.com",
    to: "you@nipun.com",
    subject: "You missed a Teams call from \"HR_Onboarding\"",
    received_at: "Today, 6:21 AM",
    body_html: `
      <div style="${FONT}">
        <div style="background:#464EB8; padding:14px 22px;">
          <span style="color:white;font-weight:600;font-size:16px;">Microsoft Teams</span>
        </div>
        <div style="padding:22px;">
          <p>You missed a call from <b>HR_Onboarding</b> at 6:18 AM. A voicemail (00:42) is waiting in your Teams inbox.</p>
          <p>The recording will be available for <b>24 hours</b> before it expires.</p>
          <p style="margin:22px 0;">${btn("Listen to Voicemail", "http://teams.microsfot.com/voicemail/abc")}</p>
          <p style="font-size:11px; color:#5f6368;">This is an automated message. Do not reply.</p>
        </div>
      </div>`,
    attachments: [],
    links: [
      {
        text: "Listen to Voicemail",
        href: "http://teams.microsfot.com/voicemail/abc",
        suspicious: true,
      },
    ],
    verdict: "suspicious",
    expected_red_flags: [
      { id: "lookalike_domain", label: "microsfot.com (typo) is not microsoft.com", explanation: "Typosquatting domain — easy to miss." },
      { id: "voicemail_lure", label: "Voicemail with 24-hour expiry", explanation: "Common phishing pattern to encourage hurried clicks." },
      { id: "http_link", label: "http:// instead of https://", explanation: "Real Microsoft links are always HTTPS." },
    ],
    rationale:
      "Almost certainly phishing — typosquatted Microsoft domain with a voicemail lure. Even if it looks low-risk, treat as suspicious and report.",
  },
];

// Redacted shape sent to the browser — strips verdicts / red-flag answers.
export function getInboxClient() {
  return INBOX_EMAILS.map(({ verdict, expected_red_flags, rationale, ...rest }) => rest);
}
export type InboxClientEmail = ReturnType<typeof getInboxClient>[number];
