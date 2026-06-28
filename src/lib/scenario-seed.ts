// AUTO-GENERATED scenario seed. Idempotent via tag 'seed'.
export interface SeedScenario {
  title: string; department: string; category: string;
  difficulty: 'easy'|'medium'|'hard'; classification: 'legitimate'|'suspicious';
  sender_name: string; sender_email: string; subject: string;
  body_html: string;
  attachments: { name: string; size: string; suspicious?: boolean }[];
  links: { text: string; href: string; suspicious?: boolean; behavior?: string }[];
  red_flags: { id: string; label: string; explanation: string }[];
  correct_action: string; explanation: string; is_mfa: boolean; tags: string[];
}

export const SEED_SCENARIOS: SeedScenario[] = [
  {
    "title": "MFA Enrollment Invitation",
    "department": "Common",
    "category": "MFA",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Nipun IT Security",
    "sender_email": "it-security@nipun.com",
    "subject": "Action Required: Enable Multi-Factor Authentication for Your Account",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>As part of our updated security policy, please enable <b>Multi-Factor Authentication</b> on your Nipun account this week.</p><p>Setup takes about a minute using Microsoft or Google Authenticator.</p><p style=\"margin:22px 0;\"><a href=\"app:enable-mfa\" style=\"display:inline-block;background:#1f4170;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Enable MFA</a></p><p>— Arjun Verma, Manager · IT Security</p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Enable MFA",
        "href": "app:enable-mfa",
        "behavior": "internal_action"
      }
    ],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Genuine internal MFA enrollment — enabling MFA is a positive security behavior.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "enrollment"
    ],
    "payload": {}
  },
  {
    "title": "MFA Enabled Successfully",
    "department": "Common",
    "category": "MFA",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Nipun IT Security",
    "sender_email": "no-reply@nipun.com",
    "subject": "Confirmation: Multi-Factor Authentication is now active on your account",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>This is a confirmation that MFA was enabled on your account at 09:42 IST today.</p><p>If you did not enable MFA, contact IT Security immediately.</p><p>— Nipun IT</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Legitimate confirmation notice — no link, no action needed.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "confirmation"
    ],
    "payload": {}
  },
  {
    "title": "New Device Verification",
    "department": "Common",
    "category": "MFA",
    "difficulty": "medium",
    "classification": "legitimate",
    "sender_name": "Microsoft account team",
    "sender_email": "account-security-noreply@accountprotection.microsoft.com",
    "subject": "Verify your new sign-in device",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>We noticed a new sign-in to your Microsoft account from <b>Bengaluru, IN · Chrome on Windows</b>.</p><p>If this was you, no action is needed. If not, sign in and review your activity.</p><p style=\"margin:22px 0;\"><a href=\"https://account.microsoft.com/security\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Review activity</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Review activity",
        "href": "https://account.microsoft.com/security",
        "behavior": "external"
      }
    ],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Legitimate Microsoft device notification from the real accountprotection.microsoft.com domain.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "device"
    ],
    "payload": {}
  },
  {
    "title": "Authentication Approval Request (Push)",
    "department": "Common",
    "category": "MFA",
    "difficulty": "medium",
    "classification": "legitimate",
    "sender_name": "Microsoft Authenticator",
    "sender_email": "no-reply@microsoft.com",
    "subject": "Approval request for sign-in to Nipun M365",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>An approval was requested for sign-in to your Microsoft 365 account.</p><p><b>Location:</b> Bengaluru, IN<br/><b>App:</b> Outlook on the web</p><p>Approve the request inside your Authenticator app. Do not approve if you did not initiate this sign-in.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Legitimate push notification reminder — instructs the user to approve inside the app, never via a link.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "push"
    ],
    "payload": {}
  },
  {
    "title": "MFA Reset Confirmation",
    "department": "Common",
    "category": "MFA",
    "difficulty": "medium",
    "classification": "legitimate",
    "sender_name": "Nipun IT Service Desk",
    "sender_email": "service-desk@nipun.com",
    "subject": "Your MFA reset request was completed",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>Your MFA reset (ticket INC-22041) has been completed. Please re-enroll your authenticator within 24 hours.</p><p>If you did not raise this ticket, reply immediately so we can lock the account.</p><p>— Service Desk</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Legitimate ticket-based reset notice with a verifiable ticket reference.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "reset"
    ],
    "payload": {}
  },
  {
    "title": "Security Verification for Account Change",
    "department": "Common",
    "category": "MFA",
    "difficulty": "medium",
    "classification": "legitimate",
    "sender_name": "Nipun IT Security",
    "sender_email": "it-security@nipun.com",
    "subject": "Security check: recovery phone changed on your account",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>The recovery phone number on your account was updated today. If this was you, no action is needed.</p><p>If you did not make this change, reply to this email or call ext. 1900.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Legitimate account-change notice — passive, no malicious link.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "change"
    ],
    "payload": {}
  },
  {
    "title": "Fake MFA Enrollment Request",
    "department": "Common",
    "category": "MFA",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Microsoft 365 Security",
    "sender_email": "mfa-enroll@m365-secure-portal.com",
    "subject": "Mandatory: Enroll your MFA in the next 12 hours or lose access",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Dear user,</p><p>Our records show you have not enrolled MFA. Your mailbox <b>will be disabled in 12 hours</b> unless you enroll now using the secure portal below.</p><p style=\"margin:22px 0;\"><a href=\"https://m365-secure-portal.com/mfa/enroll\" style=\"display:inline-block;background:#d83b01;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Enroll MFA Now</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Enroll MFA Now",
        "href": "https://m365-secure-portal.com/mfa/enroll",
        "suspicious": true,
        "behavior": "fake_m365"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Sender domain is m365-secure-portal.com, not microsoft.com",
        "explanation": "Microsoft never uses third-party look-alike domains."
      },
      {
        "id": "urgency",
        "label": "12-hour deadline / threat of disablement",
        "explanation": "Real IT teams give realistic timelines."
      },
      {
        "id": "credential_request",
        "label": "Button opens a fake login page",
        "explanation": "Hovering reveals the look-alike URL."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Credential-harvesting phishing impersonating Microsoft 365 MFA enrollment.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "phishing",
      "m365"
    ],
    "payload": {}
  },
  {
    "title": "Fake Microsoft 365 Verification",
    "department": "Common",
    "category": "MFA",
    "difficulty": "hard",
    "classification": "suspicious",
    "sender_name": "Microsoft 365 Team",
    "sender_email": "noreply@microsoftonline-verify.com",
    "subject": "Verify your Microsoft 365 account to keep email access",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>To continue accessing your Microsoft 365 mailbox, please verify your account by signing in again below.</p><p style=\"margin:22px 0;\"><a href=\"https://microsoftonline-verify.com/login\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Verify Account</a></p><p style='font-size:11px;color:#888;'>© 2026 Microsoft</p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Verify Account",
        "href": "https://microsoftonline-verify.com/login",
        "suspicious": true,
        "behavior": "fake_m365"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "microsoftonline-verify.com is not a Microsoft domain",
        "explanation": "Real Microsoft links go to *.microsoft.com or *.live.com."
      },
      {
        "id": "credential_request",
        "label": "Asks you to re-enter credentials",
        "explanation": "Microsoft does not request re-verification this way."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Classic Microsoft 365 credential phishing.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "phishing",
      "m365"
    ],
    "payload": {}
  },
  {
    "title": "Fake VPN Authentication Request",
    "department": "Common",
    "category": "MFA",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Nipun VPN Gateway",
    "sender_email": "vpn-gateway@nipun-corp.net",
    "subject": "VPN authentication required — confirm to keep your session active",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Your VPN session needs re-authentication. Click below and sign in with your domain credentials to keep working.</p><p style=\"margin:22px 0;\"><a href=\"https://nipun-corp.net/vpn/auth\" style=\"display:inline-block;background:#1f4170;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Re-authenticate VPN</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Re-authenticate VPN",
        "href": "https://nipun-corp.net/vpn/auth",
        "suspicious": true,
        "behavior": "fake_vpn"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "nipun-corp.net is not nipun.com",
        "explanation": "Look-alike domain."
      },
      {
        "id": "credential_request",
        "label": "VPN never re-authenticates via email link",
        "explanation": "VPN sessions are renewed in the client, not from email."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Fake VPN credential harvester.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "phishing",
      "vpn"
    ],
    "payload": {}
  },
  {
    "title": "Fake MFA Reset Notification",
    "department": "Common",
    "category": "MFA",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "IT Security",
    "sender_email": "alerts@it-helpdesk-portal.com",
    "subject": "Your MFA was reset — confirm if this was not you",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Your MFA settings were reset 5 minutes ago. If this was not you, click the link below to reverse the change immediately.</p><p style=\"margin:22px 0;\"><a href=\"http://it-helpdesk-portal.com/mfa/reverse\" style=\"display:inline-block;background:#d83b01;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Reverse MFA reset</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Reverse MFA reset",
        "href": "http://it-helpdesk-portal.com/mfa/reverse",
        "suspicious": true,
        "behavior": "fake_m365"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "it-helpdesk-portal.com is not the corporate help desk",
        "explanation": "Corporate help desks use the corporate domain."
      },
      {
        "id": "urgency",
        "label": "Creates panic to bypass thinking",
        "explanation": "Reset reversal is never one-click from an email."
      },
      {
        "id": "http_link",
        "label": "Insecure http:// link",
        "explanation": "Real reset flows use HTTPS."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Panic-bait phishing — fake reset to scare a click.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "phishing"
    ],
    "payload": {}
  },
  {
    "title": "Account-will-be-disabled MFA threat",
    "department": "Common",
    "category": "MFA",
    "difficulty": "easy",
    "classification": "suspicious",
    "sender_name": "Office365 Admin",
    "sender_email": "admin@office365-secure.com",
    "subject": "FINAL NOTICE: Your account will be disabled if MFA is not enabled today",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Dear user,</p><p>This is the FINAL NOTICE. Your account <b>will be disabled at midnight</b> unless you enable MFA via the button below.</p><p style=\"margin:22px 0;\"><a href=\"https://office365-secure.com/mfa\" style=\"display:inline-block;background:#d83b01;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Enable MFA Now</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Enable MFA Now",
        "href": "https://office365-secure.com/mfa",
        "suspicious": true,
        "behavior": "fake_m365"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "office365-secure.com is not microsoft.com",
        "explanation": "Look-alike domain."
      },
      {
        "id": "urgency",
        "label": "Threat of imminent disablement",
        "explanation": "Pressure tactic."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Threat-based phishing demanding a click.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "phishing"
    ],
    "payload": {}
  },
  {
    "title": "Fake Authentication Approval Push",
    "department": "Common",
    "category": "MFA",
    "difficulty": "hard",
    "classification": "suspicious",
    "sender_name": "Microsoft Authenticator",
    "sender_email": "noreply@authenticator-microsoft.net",
    "subject": "Approve sign-in attempt — click here to approve",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>A sign-in attempt requires your approval. Approve below to continue.</p><p style=\"margin:22px 0;\"><a href=\"https://authenticator-microsoft.net/approve\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Approve sign-in</a></p><p>If you did not initiate this, ignore the message.</p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Approve sign-in",
        "href": "https://authenticator-microsoft.net/approve",
        "suspicious": true,
        "behavior": "fake_m365"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "authenticator-microsoft.net is not microsoft.com",
        "explanation": "Microsoft never sends 'approve' links via email."
      },
      {
        "id": "credential_request",
        "label": "Real push approvals happen inside the app",
        "explanation": "Email-based 'approve' buttons do not exist."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Push-fatigue phishing — tricks users into approving attacker logins.",
    "is_mfa": true,
    "tags": [
      "mfa",
      "phishing",
      "push"
    ],
    "payload": {}
  },
  {
    "title": "Product Sales Enquiry",
    "department": "External",
    "category": "Sales Enquiry",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Sara Iqbal",
    "sender_email": "sara.iqbal@acme-industries.com",
    "subject": "Enquiry: Bulk pricing for industrial routers",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hello,</p><p>We are evaluating routers for a 30-site rollout. Could you share bulk pricing and lead times?</p><p>Best, Sara</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine vendor enquiry — no action required beyond a normal reply.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Partnership Request",
    "department": "External",
    "category": "Partnership",
    "difficulty": "medium",
    "classification": "legitimate",
    "sender_name": "Vikram Nair",
    "sender_email": "vikram@partnersync.io",
    "subject": "Strategic partnership opportunity",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi team,</p><p>PartnerSync would like to explore a co-sell partnership for the BFSI segment. Are you open to a 30-min intro call next week?</p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Schedule meeting",
        "href": "meeting:partnersync-intro",
        "behavior": "meeting_invite"
      }
    ],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Normal partner-outreach email with an internal meeting registration link.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Meeting Invitation — Vendor Review",
    "department": "External",
    "category": "Meeting",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Calendar",
    "sender_email": "no-reply@nipun.com",
    "subject": "Invitation: Quarterly Vendor Review · Thu 11:00",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Quarterly vendor review with Acme Industries. Decks attached to the calendar invite.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine internal calendar invite.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Vendor Communication — SLA Update",
    "department": "External",
    "category": "Vendor",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Acme Support",
    "sender_email": "support@acme-industries.com",
    "subject": "Updated SLA for your existing support contract",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hello,</p><p>Please find the updated SLA document attached for your records. No action required.</p></div>",
    "attachments": [
      {
        "name": "Acme_SLA_2026.pdf",
        "size": "180 KB"
      }
    ],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine vendor SLA update.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Product Quotation Request",
    "department": "External",
    "category": "Sales Enquiry",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Procurement Dept.",
    "sender_email": "procurement@global-tenders-portal.com",
    "subject": "Urgent quotation required — large tender",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Please submit your quotation in our procurement portal in the next 24 hours to be considered for a 2-crore tender.</p><p style=\"margin:18px 0;\"><a href=\"https://global-tenders-portal.com/login\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open Procurement Portal</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open Procurement Portal",
        "href": "https://global-tenders-portal.com/login",
        "suspicious": true,
        "behavior": "fake_m365"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Unknown procurement domain",
        "explanation": "Always verify procurement portals with the buyer directly."
      },
      {
        "id": "urgency",
        "label": "24-hour pressure",
        "explanation": "Genuine tenders allow several days."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Procurement bait phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Meeting Registration",
    "department": "External",
    "category": "Meeting",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Webinar Team",
    "sender_email": "events@webinar-microsoft-events.com",
    "subject": "You are invited: Free Microsoft cloud architecture workshop",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Register now to reserve your seat (limited). Free of charge.</p><p style=\"margin:18px 0;\"><a href=\"https://webinar-microsoft-events.com/register\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Register Now</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Register Now",
        "href": "https://webinar-microsoft-events.com/register",
        "suspicious": true,
        "behavior": "fake_m365"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Not a Microsoft domain",
        "explanation": "Microsoft events live at events.microsoft.com."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Webinar-bait phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Survey from Customer",
    "department": "External",
    "category": "Survey",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Reena Kapoor",
    "sender_email": "reena.k@globex.com",
    "subject": "Quick 3-question feedback survey",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>Could you spare 2 minutes to fill our customer feedback form? Your input shapes our roadmap.</p><p style=\"margin:18px 0;\"><a href=\"survey:cust-feedback-q2\" style=\"display:inline-block;background:#0a8a45;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open survey</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open survey",
        "href": "survey:cust-feedback-q2",
        "behavior": "survey"
      }
    ],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Internal survey form launched by trusted external partner.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Document Share — Contract",
    "department": "External",
    "category": "Vendor",
    "difficulty": "hard",
    "classification": "suspicious",
    "sender_name": "DocuSign",
    "sender_email": "dse@docusign-sign-portal.com",
    "subject": "Completed: \"MSA Renewal.pdf\" ready for signature",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Please review and sign the MSA renewal.</p><p style=\"margin:18px 0;\"><a href=\"https://docusign-sign-portal.com/sign?id=44291\" style=\"display:inline-block;background:#f7b500;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Review document</a></p></div>",
    "attachments": [
      {
        "name": "MSA_Renewal.htm",
        "size": "22 KB",
        "suspicious": true
      }
    ],
    "links": [
      {
        "text": "Review document",
        "href": "https://docusign-sign-portal.com/sign?id=44291",
        "suspicious": true,
        "behavior": "fake_document"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "docusign-sign-portal.com is not docusign.net",
        "explanation": "DocuSign only uses docusign.net."
      },
      {
        "id": "html_attachment",
        "label": ".htm masquerading as PDF",
        "explanation": "HTML attachments are credential-harvest payloads."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "DocuSign clone phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Salary Hike Letter",
    "department": "HR",
    "category": "Compensation",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Priya Menon",
    "sender_email": "priya.menon@nipun.com",
    "subject": "Your annual compensation revision letter",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>Please find attached your revised compensation letter effective 1 July. Your manager will walk you through the changes.</p></div>",
    "attachments": [
      {
        "name": "Compensation_Letter_2026.pdf",
        "size": "210 KB"
      }
    ],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Genuine HR comp letter on the corporate domain.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Salary Deduction Notice",
    "department": "HR",
    "category": "Compensation",
    "difficulty": "medium",
    "classification": "legitimate",
    "sender_name": "Priya Menon",
    "sender_email": "priya.menon@nipun.com",
    "subject": "Notice: One-day leave-without-pay adjustment for May payroll",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>As per your leave record, one day in May was marked LWP. The adjustment will reflect in your June payslip.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine payroll adjustment from real HR.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Leave Approval",
    "department": "HR",
    "category": "Leave",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Workday Notifications",
    "sender_email": "no-reply@workday.nipun.com",
    "subject": "Your leave request has been approved",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Your leave request (12–14 Jul) was approved by your manager.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Standard Workday notification.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Leave Rejection",
    "department": "HR",
    "category": "Leave",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Workday Notifications",
    "sender_email": "no-reply@workday.nipun.com",
    "subject": "Your leave request requires changes",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Your leave request (5 Jul) was returned by your manager with a comment in Workday.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Standard Workday notification.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Performance Appraisal Window Open",
    "department": "HR",
    "category": "Appraisal",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Priya Menon",
    "sender_email": "priya.menon@nipun.com",
    "subject": "FY26 appraisal window opens Monday",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi team,</p><p>Please complete your self-appraisal in Workday by 15 July. Manager reviews follow on 22 July.</p><p style=\"margin:18px 0;\"><a href=\"https://workday.nipun.com\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open Workday</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open Workday",
        "href": "https://workday.nipun.com",
        "behavior": "external"
      }
    ],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine HR appraisal-window notice.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "HR Policy Update",
    "department": "HR",
    "category": "Policy",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Priya Menon",
    "sender_email": "priya.menon@nipun.com",
    "subject": "Updated remote-work policy — effective 1 August",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi team,</p><p>The remote-work policy has been refreshed. Highlights and the full document are attached.</p></div>",
    "attachments": [
      {
        "name": "Remote_Work_Policy_v3.pdf",
        "size": "340 KB"
      }
    ],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Genuine HR policy update.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Bonus / Salary Hike Notification",
    "department": "HR",
    "category": "Compensation",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "HR Department",
    "sender_email": "hr-notifications@nipun-hr-portal.com",
    "subject": "Your performance bonus is ready — claim now",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Congratulations! Your performance bonus has been processed. Sign in to the HR portal to view and accept.</p><p style=\"margin:18px 0;\"><a href=\"https://nipun-hr-portal.com/login\" style=\"display:inline-block;background:#0a8a45;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open HR Portal</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open HR Portal",
        "href": "https://nipun-hr-portal.com/login",
        "suspicious": true,
        "behavior": "fake_hr"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "nipun-hr-portal.com is not the corporate domain",
        "explanation": "HR mail comes from nipun.com."
      },
      {
        "id": "salary_bait",
        "label": "Bonus lure",
        "explanation": "Emotional money lure is classic phishing."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Salary-bait phishing impersonating HR.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Employee Benefits Survey",
    "department": "HR",
    "category": "Survey",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "HR Benefits",
    "sender_email": "benefits@hr-pulse-survey.com",
    "subject": "Confirm your benefits enrollment — last day",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Please confirm your 2026 benefits selections by logging into the portal below.</p><p style=\"margin:18px 0;\"><a href=\"https://hr-pulse-survey.com/auth\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open Benefits Portal</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open Benefits Portal",
        "href": "https://hr-pulse-survey.com/auth",
        "suspicious": true,
        "behavior": "fake_hr"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Unknown HR domain",
        "explanation": "HR portals live on the corporate domain."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "HR benefits credential phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Urgent Meeting Invite",
    "department": "CEO/Management",
    "category": "Meeting",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Rajesh Kumar",
    "sender_email": "rajesh.kumar@nipun.com",
    "subject": "All-hands at 4 PM today — please join",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Team, please join the all-hands at 4 PM in the main conference room. Agenda inside the calendar invite.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Genuine internal all-hands invite.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Executive Announcement",
    "department": "CEO/Management",
    "category": "Announcement",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "CEO Office",
    "sender_email": "ceo-office@nipun.com",
    "subject": "Welcoming our new VP of Engineering",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Team,</p><p>I am pleased to announce that Sneha Iyer joins us as VP Engineering on 1 August. Please join me in welcoming her.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine exec announcement from real corporate domain.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Finance Approval Request from CEO",
    "department": "CEO/Management",
    "category": "Finance",
    "difficulty": "medium",
    "classification": "legitimate",
    "sender_name": "Rajesh Kumar",
    "sender_email": "rajesh.kumar@nipun.com",
    "subject": "Approval needed on Q3 budget revision",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Please review the attached Q3 budget revision and approve in Workday by Friday EOD.</p></div>",
    "attachments": [
      {
        "name": "Q3_Budget_Revision.xlsx",
        "size": "410 KB"
      }
    ],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Genuine budget approval routed via Workday.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "CEO Fraud — Gift Cards",
    "department": "CEO/Management",
    "category": "BEC",
    "difficulty": "easy",
    "classification": "suspicious",
    "sender_name": "Rajesh Kumar",
    "sender_email": "rajesh.kumar.nipun@gmail.com",
    "subject": "Are you available? Need a quick favour",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>I'm in a meeting. Can you grab £500 in Amazon gift cards for a client gift and send me the codes? I'll reimburse later.</p><p>Sent from my iPhone</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [
      {
        "id": "ceo_impersonation",
        "label": "Personal gmail.com address impersonating the CEO",
        "explanation": "Executives never email from personal addresses for company business."
      },
      {
        "id": "urgency",
        "label": "Pressure for an off-policy purchase",
        "explanation": "Bypass-controls request."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Classic gift-card BEC scam.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "CEO Fraud — Wire Transfer",
    "department": "CEO/Management",
    "category": "BEC",
    "difficulty": "hard",
    "classification": "suspicious",
    "sender_name": "Rajesh Kumar",
    "sender_email": "rajesh.kumar@nipun-corp.co",
    "subject": "Confidential acquisition — wire transfer today",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>I'm closing an acquisition. Please process a wire transfer of USD 240,000 to the attached account today. Keep this confidential — do not loop in finance until I announce.</p></div>",
    "attachments": [
      {
        "name": "Wire_Instructions.pdf",
        "size": "80 KB"
      }
    ],
    "links": [],
    "red_flags": [
      {
        "id": "ceo_impersonation",
        "label": "Look-alike domain nipun-corp.co",
        "explanation": "Tiny domain differences are the giveaway."
      },
      {
        "id": "secrecy_request",
        "label": "Demands bypass of finance controls",
        "explanation": "Real executives respect financial controls."
      },
      {
        "id": "urgency",
        "label": "Same-day wire pressure",
        "explanation": "Urgency prevents out-of-band verification."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "High-value BEC wire fraud.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Remote Access Request",
    "department": "CEO/Management",
    "category": "BEC",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Rajesh Kumar (Office)",
    "sender_email": "rajesh.kumar@nipun-management.co",
    "subject": "Need remote access to your laptop — urgent",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>I need to access a file on your laptop urgently. Install the tool from the link below and share the ID.</p><p style=\"margin:18px 0;\"><a href=\"http://remote-help-portal.com/install\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Install Remote Tool</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Install Remote Tool",
        "href": "http://remote-help-portal.com/install",
        "suspicious": true,
        "behavior": "fake_document"
      }
    ],
    "red_flags": [
      {
        "id": "ceo_impersonation",
        "label": "Look-alike domain",
        "explanation": "Executive impersonation via mimic domain."
      },
      {
        "id": "credential_request",
        "label": "Unverified RAT install",
        "explanation": "Legit remote access goes through IT, not exec email."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Remote-access trojan delivery via exec impersonation.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Purchase Order Received",
    "department": "Sales",
    "category": "PO",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Reena Kapoor",
    "sender_email": "reena.k@globex.com",
    "subject": "PO #GLX-44912 attached for Q3 order",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>Please find PO GLX-44912 attached. Kindly confirm receipt and dispatch ETA.</p></div>",
    "attachments": [
      {
        "name": "PO_GLX-44912.pdf",
        "size": "95 KB"
      }
    ],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Genuine PO from existing customer contact.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Tender Details — Government",
    "department": "Sales",
    "category": "Tender",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "GeM Notifications",
    "sender_email": "no-reply@gem.gov.in",
    "subject": "New tender published matching your category",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>A new tender has been published in your category. Bid submission window closes 21 July.</p><p style=\"margin:18px 0;\"><a href=\"https://gem.gov.in/tender/9921\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">View tender</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "View tender",
        "href": "https://gem.gov.in/tender/9921",
        "behavior": "external"
      }
    ],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Genuine GeM tender notification.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Sales Incentive Announcement",
    "department": "Sales",
    "category": "Incentive",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Sales Ops",
    "sender_email": "sales-ops@nipun.com",
    "subject": "Q3 incentive plan — accelerators raised",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Team, the Q3 incentive plan is live. Highlights inside; full deck attached.</p></div>",
    "attachments": [
      {
        "name": "Q3_Incentive_Plan.pdf",
        "size": "260 KB"
      }
    ],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine internal sales-ops announcement.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Quotation Request from Prospect",
    "department": "Sales",
    "category": "Quotation",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Anita Shah",
    "sender_email": "anita.shah@kestrel-mfg.in",
    "subject": "Quotation request — 200 units of switches",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>Could you share a quote for 200 units of model XR-220 with 3-year support?</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine inbound quote request.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Tender Alert",
    "department": "Sales",
    "category": "Tender",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Tender Alerts",
    "sender_email": "alerts@tender-india-portal.com",
    "subject": "URGENT: ₹5cr tender closing in 6 hours — quote now",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Major tender closes in 6 hours. Sign in to download specs and submit quote.</p><p style=\"margin:18px 0;\"><a href=\"https://tender-india-portal.com/login\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open Tender Portal</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open Tender Portal",
        "href": "https://tender-india-portal.com/login",
        "suspicious": true,
        "behavior": "fake_m365"
      }
    ],
    "red_flags": [
      {
        "id": "urgency",
        "label": "6-hour deadline",
        "explanation": "Manufactured urgency."
      },
      {
        "id": "lookalike_domain",
        "label": "Unknown tender portal",
        "explanation": "Genuine tenders live on gem.gov.in / eprocure."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Tender-bait phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Customer Payment Confirmation",
    "department": "Sales",
    "category": "PO",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Accounts",
    "sender_email": "accounts@global-payments-portal.com",
    "subject": "Your customer has paid — verify to release goods",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Your customer's payment is held pending verification. Verify in the portal to release goods.</p><p style=\"margin:18px 0;\"><a href=\"https://global-payments-portal.com/verify\" style=\"display:inline-block;background:#0a8a45;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Verify Payment</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Verify Payment",
        "href": "https://global-payments-portal.com/verify",
        "suspicious": true,
        "behavior": "fake_payment"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Unknown payments portal",
        "explanation": "Genuine payments come through the bank, not an email portal."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Payment-portal credential phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Client Solution Discussion",
    "department": "Pre-Sales",
    "category": "Solutioning",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Sandeep Rao",
    "sender_email": "sandeep@axiombank.in",
    "subject": "Re: Solution proposal for branch network refresh",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>Thanks for the deck. Two follow-ups inline; can we close on the BoM by Friday?</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine pre-sales follow-up.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Product Demo Request",
    "department": "Pre-Sales",
    "category": "Demo",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Karan Mehta",
    "sender_email": "karan@razorpay.com",
    "subject": "Can we get a demo of the analytics module?",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>Could you set up a 45-min demo of the analytics module for our team next week?</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine inbound demo request.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Technical Proposal Shared",
    "department": "Pre-Sales",
    "category": "Proposal",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Sneha Iyer",
    "sender_email": "sneha.iyer@nipun.com",
    "subject": "Tech proposal v2 attached — please review",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>v2 of the proposal addressing the security questions is attached. Please share comments by Wednesday.</p></div>",
    "attachments": [
      {
        "name": "Proposal_v2.pdf",
        "size": "540 KB"
      }
    ],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine internal pre-sales doc.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Remote Meeting Invite",
    "department": "Pre-Sales",
    "category": "Meeting",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Calendar",
    "sender_email": "no-reply@nipun.com",
    "subject": "Invitation: Customer architecture review · Tue 15:00",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Microsoft Teams link in the calendar invite.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine internal meeting invite.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Client Document Share",
    "department": "Pre-Sales",
    "category": "Solutioning",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Anjali Roy",
    "sender_email": "anjali.r@client-doc-share.com",
    "subject": "Client requirements document — open to view",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>Please review the requirements document in the secure portal below.</p><p style=\"margin:18px 0;\"><a href=\"https://client-doc-share.com/view\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open Document</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open Document",
        "href": "https://client-doc-share.com/view",
        "suspicious": true,
        "behavior": "fake_document"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Unknown document-share domain",
        "explanation": "Real clients use established platforms like SharePoint/Drive."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Document-share credential phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Site Meeting Confirmation",
    "department": "Implementation",
    "category": "Site Meeting",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Mohan Pillai",
    "sender_email": "mohan.p@axiombank.in",
    "subject": "Site meeting confirmed for Friday 11 AM",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Site meeting confirmed at the Andheri branch on Friday at 11 AM. Pass details attached.</p></div>",
    "attachments": [
      {
        "name": "Visitor_Pass.pdf",
        "size": "75 KB"
      }
    ],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine site logistics.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Escalation — Customer Outage",
    "department": "Implementation",
    "category": "Escalation",
    "difficulty": "medium",
    "classification": "legitimate",
    "sender_name": "Sneha Iyer",
    "sender_email": "sneha.iyer@nipun.com",
    "subject": "P1 escalation — Axiom Bank branch offline since 9 AM",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi, please join the bridge urgently. Customer P1.</p><p style=\"margin:18px 0;\"><a href=\"https://teams.microsoft.com/l/meetup-join/p1-bridge\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Join Bridge</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Join Bridge",
        "href": "https://teams.microsoft.com/l/meetup-join/p1-bridge",
        "behavior": "external"
      }
    ],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Genuine internal P1 escalation.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Weekly Project Status Report",
    "department": "Implementation",
    "category": "Reporting",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "PMO",
    "sender_email": "pmo@nipun.com",
    "subject": "Submit your weekly project status by Friday EOD",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Reminder to submit your project status in the PMO tracker by Friday EOD.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine PMO reminder.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Installation Request",
    "department": "Implementation",
    "category": "Install",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Karan Mehta",
    "sender_email": "karan@razorpay.com",
    "subject": "Installation request — 4 access points at HQ",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>Please schedule installation of 4 APs at our HQ between 5–8 July.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine customer install request.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Project File Share",
    "department": "Implementation",
    "category": "Reporting",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Customer PMO",
    "sender_email": "pmo@axiombank-projects.com",
    "subject": "Updated project plan — open to view latest scope",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Latest project plan attached. Open in the portal to view changes.</p><p style=\"margin:18px 0;\"><a href=\"https://axiombank-projects.com/login\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open project portal</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open project portal",
        "href": "https://axiombank-projects.com/login",
        "suspicious": true,
        "behavior": "fake_document"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Unknown customer-projects domain",
        "explanation": "Customer PMOs share via SharePoint/Drive, not random domains."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Document-share credential phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Invoice Approval Needed",
    "department": "Finance",
    "category": "Invoice",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Workday Finance",
    "sender_email": "no-reply@workday.nipun.com",
    "subject": "Invoice INV-7741 pending your approval",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Invoice INV-7741 (₹84,200) is pending your approval in Workday.</p><p style=\"margin:18px 0;\"><a href=\"https://workday.nipun.com/invoices/INV-7741\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Approve in Workday</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Approve in Workday",
        "href": "https://workday.nipun.com/invoices/INV-7741",
        "behavior": "external"
      }
    ],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine Workday invoice routing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Payment Confirmation",
    "department": "Finance",
    "category": "Payment",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Accounts Payable",
    "sender_email": "ap@nipun.com",
    "subject": "Payment confirmation — Vendor #4421",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Payment of ₹3,42,000 to Vendor 4421 was released today via NEFT.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine AP confirmation.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Agreed Payment Bill",
    "department": "Finance",
    "category": "Invoice",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Vidya Krishnan",
    "sender_email": "vidya@kestrel-mfg.in",
    "subject": "Invoice for May supply — agreed schedule",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Please find the May invoice as per agreed payment schedule.</p></div>",
    "attachments": [
      {
        "name": "Invoice_May.pdf",
        "size": "180 KB"
      }
    ],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine vendor invoice.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Vendor Bank-Account Change Request",
    "department": "Finance",
    "category": "Payment",
    "difficulty": "hard",
    "classification": "suspicious",
    "sender_name": "Vidya Krishnan",
    "sender_email": "vidya.krishnan@kestrel-mfg.co",
    "subject": "Updated bank details — please use for next payment",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>We have switched banks. Please update our payee details to the attached account before the next payment run.</p></div>",
    "attachments": [
      {
        "name": "New_Bank_Details.pdf",
        "size": "60 KB"
      }
    ],
    "links": [],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Domain changed from .in to .co",
        "explanation": "Tiny domain change."
      },
      {
        "id": "credential_request",
        "label": "Bank-detail change without verification",
        "explanation": "Always verify by phone using a known number, never the one in the email."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Vendor email compromise (VEC) bank-detail fraud.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Urgent Fund Transfer from Finance Director",
    "department": "Finance",
    "category": "BEC",
    "difficulty": "hard",
    "classification": "suspicious",
    "sender_name": "Anu Sharma — Finance Director",
    "sender_email": "anu.sharma@nipun-finance.co",
    "subject": "Urgent transfer — confidential M&A payment",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Process a transfer of USD 180,000 today to the attached account. Keep confidential — do not loop in CFO until announcement.</p></div>",
    "attachments": [
      {
        "name": "Wire_Beneficiary.pdf",
        "size": "70 KB"
      }
    ],
    "links": [],
    "red_flags": [
      {
        "id": "ceo_impersonation",
        "label": "Look-alike finance domain",
        "explanation": "Real exec mails come from nipun.com."
      },
      {
        "id": "secrecy_request",
        "label": "Bypass-CFO instruction",
        "explanation": "Real Finance Directors do not bypass policy."
      },
      {
        "id": "urgency",
        "label": "Same-day pressure",
        "explanation": "Urgency disables verification."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Finance Director impersonation BEC.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Invoice Approval",
    "department": "Finance",
    "category": "Invoice",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Invoicing",
    "sender_email": "noreply@invoice-cloud-portal.com",
    "subject": "Invoice ready — sign in to approve and release payment",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Sign in to the invoicing portal to review and approve the attached invoice.</p><p style=\"margin:18px 0;\"><a href=\"https://invoice-cloud-portal.com/login\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open Invoicing Portal</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open Invoicing Portal",
        "href": "https://invoice-cloud-portal.com/login",
        "suspicious": true,
        "behavior": "fake_payment"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Unknown invoicing portal",
        "explanation": "Real invoices route via Workday."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Invoicing-portal credential phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Vendor Payment Request",
    "department": "Finance",
    "category": "Payment",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Vendor Payments",
    "sender_email": "ap@vendor-payments-portal.com",
    "subject": "Vendor payment held — verify account",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Vendor payment is held. Verify the receiving account in the portal to release.</p><p style=\"margin:18px 0;\"><a href=\"https://vendor-payments-portal.com/verify\" style=\"display:inline-block;background:#d83b01;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Verify Account</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Verify Account",
        "href": "https://vendor-payments-portal.com/verify",
        "suspicious": true,
        "behavior": "fake_payment"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Unknown payments portal",
        "explanation": "Real bank verifications happen inside the bank portal."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Payment-portal phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Payslip Available",
    "department": "Finance",
    "category": "Payroll",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Workday Payroll",
    "sender_email": "no-reply@workday.nipun.com",
    "subject": "Your June payslip is now available",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Your June payslip is available in Workday Payroll.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine payslip notification.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Internal Announcement",
    "department": "Common",
    "category": "Announcement",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "CEO Office",
    "sender_email": "ceo-office@nipun.com",
    "subject": "Town hall recording now available",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>The recording of last Friday's town hall is available on the intranet.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine internal comms.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Shared Document — Intranet Update",
    "department": "Common",
    "category": "Document",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "IT Helpdesk",
    "sender_email": "helpdesk@nipun.com",
    "subject": "VPN client update — install by Friday",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>A new VPN client (v5.2) is available. Please install via Company Portal by Friday.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine IT update.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Password Expiry Notification",
    "department": "Common",
    "category": "Password",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Nipun IT",
    "sender_email": "no-reply@nipun.com",
    "subject": "Your Nipun password expires in 5 days",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Your password expires in 5 days. Change it from your locked workstation (Ctrl-Alt-Del → Change Password) or via Self Service.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine internal expiry notice — instructs in-app change, not a link.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Escalation — Customer Issue",
    "department": "Common",
    "category": "Escalation",
    "difficulty": "medium",
    "classification": "legitimate",
    "sender_name": "Service Manager",
    "sender_email": "svc-mgr@nipun.com",
    "subject": "Customer escalation — please respond by EOD",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Hi,</p><p>The customer has escalated this ticket. Please share an update by EOD today.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine internal escalation.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Meeting Invitation — All-Hands",
    "department": "Common",
    "category": "Meeting",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "Calendar",
    "sender_email": "no-reply@nipun.com",
    "subject": "Invitation: All-Hands · Friday 16:00",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Standard quarterly all-hands invite. Teams link in calendar.</p></div>",
    "attachments": [],
    "links": [],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Routine all-hands invite.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Internal Form — IT Asset Survey",
    "department": "Common",
    "category": "Survey",
    "difficulty": "easy",
    "classification": "legitimate",
    "sender_name": "IT Asset Mgmt",
    "sender_email": "asset-mgmt@nipun.com",
    "subject": "Annual IT-asset attestation — 2 minutes",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Please confirm your assigned IT assets via the internal form below.</p><p style=\"margin:18px 0;\"><a href=\"form:asset-attestation\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open Form</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open Form",
        "href": "form:asset-attestation",
        "behavior": "internal_form"
      }
    ],
    "red_flags": [],
    "correct_action": "ignore",
    "explanation": "Genuine internal form.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Password Expiry",
    "department": "Common",
    "category": "Password",
    "difficulty": "easy",
    "classification": "suspicious",
    "sender_name": "Microsoft 365 Admin",
    "sender_email": "admin@m365-password-reset.com",
    "subject": "Your password expires today — reset immediately",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Your Microsoft 365 password expires in 1 hour. Reset now to keep working.</p><p style=\"margin:18px 0;\"><a href=\"https://m365-password-reset.com/reset\" style=\"display:inline-block;background:#d83b01;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Reset Password</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Reset Password",
        "href": "https://m365-password-reset.com/reset",
        "suspicious": true,
        "behavior": "fake_m365"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Unknown reset portal",
        "explanation": "Real password resets happen on the corporate domain."
      },
      {
        "id": "urgency",
        "label": "1-hour deadline",
        "explanation": "Pressure tactic."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Password-reset credential phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Shared Document",
    "department": "Common",
    "category": "Document",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "OneDrive",
    "sender_email": "share-noreply@onedrive-microsoft-secure.com",
    "subject": "A document has been shared with you",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Anita Shah has shared 'Q3 Plan' with you.</p><p style=\"margin:18px 0;\"><a href=\"https://onedrive-microsoft-secure.com/view\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open Document</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open Document",
        "href": "https://onedrive-microsoft-secure.com/view",
        "suspicious": true,
        "behavior": "fake_document"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Not a Microsoft domain",
        "explanation": "Real OneDrive shares come from onedrive.live.com / microsoft.com."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "OneDrive credential phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Voicemail Notification",
    "department": "Common",
    "category": "Voicemail",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Microsoft Teams",
    "sender_email": "voicemail@teams-microsfot.com",
    "subject": "You have a new voicemail (1:42)",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>A new voicemail is waiting in your Teams inbox. Listen below.</p><p style=\"margin:18px 0;\"><a href=\"http://teams-microsfot.com/voicemail/abc\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Listen to voicemail</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Listen to voicemail",
        "href": "http://teams-microsfot.com/voicemail/abc",
        "suspicious": true,
        "behavior": "fake_m365"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "teams-microsfot.com is a typo of microsoft",
        "explanation": "Typosquat."
      },
      {
        "id": "http_link",
        "label": "Insecure http://",
        "explanation": "Real Microsoft links are HTTPS."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Voicemail-bait phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  },
  {
    "title": "Fake Internal Survey with Login",
    "department": "Common",
    "category": "Survey",
    "difficulty": "medium",
    "classification": "suspicious",
    "sender_name": "Employee Engagement",
    "sender_email": "pulse@employee-engagement-survey.com",
    "subject": "Mandatory: Complete employee pulse survey",
    "body_html": "<div style=\"font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#202124;font-size:14px;line-height:1.55;\"><p>Please sign in to the survey portal with your work credentials and complete the pulse survey.</p><p style=\"margin:18px 0;\"><a href=\"https://employee-engagement-survey.com/login\" style=\"display:inline-block;background:#0067b8;color:#fff !important;text-decoration:none;padding:10px 22px;border-radius:4px;font-weight:600;font-size:13px;\">Open Survey</a></p></div>",
    "attachments": [],
    "links": [
      {
        "text": "Open Survey",
        "href": "https://employee-engagement-survey.com/login",
        "suspicious": true,
        "behavior": "fake_m365"
      }
    ],
    "red_flags": [
      {
        "id": "lookalike_domain",
        "label": "Unknown survey portal",
        "explanation": "Real internal surveys do not ask for AD credentials."
      }
    ],
    "correct_action": "report_to_security",
    "explanation": "Survey credential phishing.",
    "is_mfa": false,
    "tags": [],
    "payload": {}
  }
];
