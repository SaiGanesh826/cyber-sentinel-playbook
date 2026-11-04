// Server-only question banks for the Password Security & MFA workshop.
// Answer keys live here and are never sent to employees before submission.

export type PwItem = { id: string; text: string; unsafe: boolean; why: string; tip: string; tag: string };
export type MfaItem = {
  id: string; app: string; title: string; detail: string; location: string; device: string;
  context: string; correct: "approve" | "deny"; why: string; tip: string; tag: string;
};
export type HabitItem = { id: string; text: string; safe: boolean; why: string; tag: string };
export type IncidentOption = { id: string; text: string; points: number; why: string };
export type IncidentStage = { key: string; prompt: string; update: string; options: IncidentOption[] };
export type Incident = {
  id: string; title: string; situation: string; notification: string; clues: string[];
  identify: IncidentOption[]; tag: string;
};

export const PASSWORDS: PwItem[] = [
  { id: "p01", text: "Password123", unsafe: true, why: "One of the most common passwords in breach lists; cracked instantly.", tip: "Avoid common words and number suffixes.", tag: "common" },
  { id: "p02", text: "123456789", unsafe: true, why: "A simple number sequence tried first by every attacker.", tip: "Never use number runs.", tag: "common" },
  { id: "p03", text: "qwerty2026", unsafe: true, why: "Keyboard pattern plus the current year — highly predictable.", tip: "Avoid keyboard walks and years.", tag: "keyboard" },
  { id: "p04", text: "asdfghjkl", unsafe: true, why: "A straight keyboard row, part of every guessing list.", tip: "Avoid keyboard rows.", tag: "keyboard" },
  { id: "p05", text: "1qaz2wsx", unsafe: true, why: "A diagonal keyboard pattern that looks random but is well known.", tip: "Patterns on the keyboard are not random.", tag: "keyboard" },
  { id: "p06", text: "Rahul@1992", unsafe: true, why: "Name plus birth year — easy to guess from social media.", tip: "Never use names or birthdays.", tag: "personal" },
  { id: "p07", text: "Priya#0815", unsafe: true, why: "First name plus a birthday (15 Aug) is personal information.", tip: "Personal details are public.", tag: "personal" },
  { id: "p08", text: "Bruno2019!", unsafe: true, why: "A pet's name and year — often shared online.", tip: "Avoid pet names.", tag: "personal" },
  { id: "p09", text: "Nipun@2026", unsafe: true, why: "Company name plus year is the first thing attackers try against staff.", tip: "Never use the company name.", tag: "company" },
  { id: "p10", text: "Welcome@123", unsafe: true, why: "A typical default/onboarding password reused by many employees.", tip: "Change default passwords immediately.", tag: "common" },
  { id: "p11", text: "Nipun#Nov26", unsafe: true, why: "Company name + month + year — the classic 'monthly change' pattern.", tip: "Do not rotate predictable patterns.", tag: "company" },
  { id: "p12", text: "P@ssw0rd!", unsafe: true, why: "Letter-to-symbol swaps (a→@, o→0) are built into cracking tools.", tip: "Substitutions do not add real strength.", tag: "substitution" },
  { id: "p13", text: "Sunsh1ne!", unsafe: true, why: "A dictionary word with one predictable substitution.", tip: "Single words are weak even with symbols.", tag: "substitution" },
  { id: "p14", text: "M0nk3y!!", unsafe: true, why: "A dictionary word with leetspeak — guessed in seconds.", tip: "Leetspeak is predictable.", tag: "substitution" },
  { id: "p15", text: "Ab1!", unsafe: true, why: "Only 4 characters — length matters more than complexity.", tip: "Use at least 14+ characters.", tag: "short" },
  { id: "p16", text: "Kx9#q", unsafe: true, why: "Random-looking but far too short to resist brute force.", tip: "Short passwords fall quickly.", tag: "short" },
  { id: "p17", text: "Mumbai400001", unsafe: true, why: "City plus PIN code — personal location data.", tip: "Avoid places tied to you.", tag: "personal" },
  { id: "p18", text: "Shop@Amazon1 / Shop@Flipkart1", unsafe: true, why: "Same base password with the site name swapped — one leak exposes all.", tip: "Every account needs a different password.", tag: "reuse" },
  { id: "p19", text: "Summer2025 → Summer2026", unsafe: true, why: "Incrementing the year when forced to change is easy to predict.", tip: "Create a fresh password, don't increment.", tag: "reuse" },
  { id: "p20", text: "iloveyou", unsafe: true, why: "Top-10 most common password worldwide.", tip: "Avoid phrases everyone uses.", tag: "common" },
  { id: "p21", text: "admin", unsafe: true, why: "A default account password, the first guess on any system.", tip: "Never keep default credentials.", tag: "common" },
  { id: "p22", text: "Ravi9876543210", unsafe: true, why: "Name plus a mobile number — both easy to find.", tip: "Phone numbers are not secret.", tag: "personal" },
  { id: "s01", text: "copper-lantern-river-71-velvet", unsafe: false, why: "A long, random multi-word passphrase — very hard to guess and easy to remember.", tip: "Long passphrases are excellent.", tag: "passphrase" },
  { id: "s02", text: "Tiger!Paper.Cloud7Rocket", unsafe: false, why: "Four unrelated words with separators — long and unpredictable.", tip: "Unrelated words beat complex short strings.", tag: "passphrase" },
  { id: "s03", text: "v7#Lq2!xR9@mT4&zK", unsafe: false, why: "A 17-character random string, typical of a password manager.", tip: "Let a password manager generate these.", tag: "generated" },
  { id: "s04", text: "Bq8$wN3^hZ6!pD1#", unsafe: false, why: "Long and randomly generated with no pattern.", tip: "Store generated passwords in an approved manager.", tag: "generated" },
  { id: "s05", text: "MyBlueKettleSings@Dawn42", unsafe: false, why: "A long unusual sentence unique to this account.", tip: "Sentence passphrases are strong and memorable.", tag: "passphrase" },
  { id: "s06", text: "orbit-marble-quilt-9-spruce", unsafe: false, why: "Random words with a number — long and unique.", tip: "Keep each passphrase unique.", tag: "passphrase" },
  { id: "s07", text: "Yk4!tR8@cW1#nE6$", unsafe: false, why: "16 random characters with no dictionary words.", tip: "Random + long = strong.", tag: "generated" },
  { id: "s08", text: "PurpleCactusDrivesSlowly!88", unsafe: false, why: "Long, unusual, and unrelated to the user.", tip: "Make passphrases weird, not personal.", tag: "passphrase" },
];

export const MFA: MfaItem[] = [
  { id: "m01", app: "Microsoft Authenticator", title: "Approve sign-in?", detail: "Nipun Corp · you@nipun.com", location: "Pune, IN", device: "Windows · Edge", context: "You just typed your password into the official company portal on your own laptop.", correct: "approve", why: "You started this sign-in yourself, on your own device, moments ago.", tip: "Approve only requests you initiated right now.", tag: "legit" },
  { id: "m02", app: "Microsoft Authenticator", title: "Approve sign-in?", detail: "Nipun Corp · you@nipun.com", location: "Lagos, NG", device: "Linux · Firefox", context: "You are eating lunch and haven't touched your computer for an hour.", correct: "deny", why: "You did not try to sign in — someone else has your password.", tip: "Deny and report, then change your password.", tag: "unexpected" },
  { id: "m03", app: "Okta Verify", title: "Did you just try to sign in? (5th request)", detail: "VPN · you@nipun.com", location: "Unknown", device: "Unknown", context: "Your phone has buzzed five times in two minutes with the same prompt.", correct: "deny", why: "Repeated prompts are an MFA fatigue attack — attackers hope you approve to stop the noise.", tip: "Never approve to make notifications stop; report immediately.", tag: "fatigue" },
  { id: "m04", app: "Microsoft Authenticator", title: "Approve sign-in?", detail: "Nipun Corp", location: "Bengaluru, IN", device: "New device · Android", context: "You don't own an Android phone and aren't logging in anywhere.", correct: "deny", why: "Unfamiliar device you never used and no sign-in attempt from you.", tip: "Unknown device + no action from you = deny.", tag: "device" },
  { id: "m05", app: "Duo Mobile", title: "Login request", detail: "Outlook Web", location: "Moscow, RU", device: "Chrome", context: "You are working from the Mumbai office and already signed in.", correct: "deny", why: "A login from a country you aren't in signals stolen credentials.", tip: "Unfamiliar location — deny and report.", tag: "location" },
  { id: "m06", app: "Microsoft Authenticator", title: "Enter number 47 to sign in", detail: "Teams", location: "Mumbai, IN", device: "Windows · Teams", context: "You are presenting in a meeting and are not signing in to anything.", correct: "deny", why: "A request that arrives while you're not logging in is someone else.", tip: "Distractions are when attackers strike — deny.", tag: "unexpected" },
  { id: "m07", app: "Okta Verify", title: "Approve sign-in?", detail: "Payroll portal", location: "Mumbai, IN", device: "Windows · Chrome", context: "A colleague messages: 'I'm logging in with your account for the report, please approve.'", correct: "deny", why: "Never approve sign-ins for someone else — accounts must not be shared.", tip: "Each person uses their own account.", tag: "sharing" },
  { id: "m08", app: "Microsoft Authenticator", title: "Approve sign-in?", detail: "Nipun Corp", location: "Kyiv, UA", device: "Unknown", context: "Ten minutes ago you received an email saying your password was reset — you didn't request it.", correct: "deny", why: "An unrequested reset followed by MFA prompts means takeover is in progress.", tip: "Deny, report to IT security, secure the account.", tag: "reset" },
  { id: "m09", app: "Duo Mobile", title: "Login request (3rd)", detail: "Company VPN", location: "Unknown proxy", device: "Unknown", context: "Requests keep arriving from a source you don't recognise.", correct: "deny", why: "Repeated unknown-source requests mean your password is being used by an attacker.", tip: "Deny, report, change the password.", tag: "fatigue" },
  { id: "m10", app: "Microsoft Authenticator", title: "Approve sign-in?", detail: "Nipun Corp", location: "Pune, IN", device: "Windows · Chrome", context: "Yesterday you logged in on a cyber-café computer. Now, at home, you get a prompt you didn't start.", correct: "deny", why: "Your credentials may have been captured on the public computer.", tip: "Never log in on public PCs; deny and change your password.", tag: "public" },
  { id: "m11", app: "Okta Verify", title: "Approve sign-in?", detail: "HR portal", location: "Singapore, SG", device: "macOS · Safari", context: "It's 2:47 AM and you were asleep when this woke you up.", correct: "deny", why: "A request outside your normal activity is not you.", tip: "Odd hours + no action = deny.", tag: "hours" },
  { id: "m12", app: "Microsoft Authenticator", title: "Enter number 82 to sign in", detail: "Nipun Corp · you@nipun.com", location: "Mumbai, IN", device: "Windows · Edge", context: "You just signed in to Outlook on your work laptop and the screen shows the number 82.", correct: "approve", why: "You initiated it and the number matches what your screen shows.", tip: "Number matching confirms the request is yours.", tag: "legit" },
  { id: "m13", app: "Duo Mobile", title: "Login request", detail: "Company VPN", location: "Chennai, IN", device: "Windows · VPN client", context: "You are working from home and just clicked 'Connect' in the company VPN app.", correct: "approve", why: "This is the request you just triggered.", tip: "Check the app and timing match your action.", tag: "legit" },
  { id: "m14", app: "Microsoft Authenticator", title: "Approve sign-in?", detail: "Nipun Corp", location: "Mumbai, IN", device: "Windows", context: "Someone calls claiming to be IT: 'We're fixing your mailbox, please approve the prompt now.'", correct: "deny", why: "IT never asks you to approve prompts over the phone — this is social engineering.", tip: "Hang up, deny, and call IT on the official number.", tag: "sharing" },
];

export const HABITS: HabitItem[] = [
  { id: "h01", text: "Use unique passwords for different accounts", safe: true, why: "One leak cannot unlock other accounts.", tag: "reuse" },
  { id: "h02", text: "Enable MFA on company accounts", safe: true, why: "Stops most account takeovers even if a password leaks.", tag: "mfa" },
  { id: "h03", text: "Use an organisation-approved password manager", safe: true, why: "Generates and stores strong unique passwords safely.", tag: "storage" },
  { id: "h04", text: "Deny unexpected MFA approval requests", safe: true, why: "Unexpected prompts mean someone else has your password.", tag: "mfa" },
  { id: "h05", text: "Report suspicious login notifications", safe: true, why: "Lets security respond before damage is done.", tag: "report" },
  { id: "h06", text: "Lock your computer before leaving your desk", safe: true, why: "Prevents others from using your logged-in session.", tag: "device" },
  { id: "h07", text: "Use long and unique passphrases", safe: true, why: "Length makes guessing practically impossible.", tag: "strength" },
  { id: "h08", text: "Change compromised passwords immediately", safe: true, why: "Cuts off attackers who hold the old password.", tag: "report" },
  { id: "h09", text: "Verify unexpected password-reset requests", safe: true, why: "Reset requests are a common takeover trick.", tag: "report" },
  { id: "h10", text: "Use the official company login page", safe: true, why: "Avoids fake login pages that steal credentials.", tag: "phishing" },
  { id: "h11", text: "Review your account sign-in activity", safe: true, why: "Helps you spot unknown logins early.", tag: "report" },
  { id: "h12", text: "Use approved authentication methods", safe: true, why: "Approved methods are managed and protected by IT.", tag: "mfa" },
  { id: "h13", text: "Keep account recovery information updated", safe: true, why: "Ensures only you can recover the account.", tag: "storage" },
  { id: "h14", text: "Use phishing-resistant authentication when provided", safe: true, why: "Security keys/passkeys cannot be phished.", tag: "mfa" },
  { id: "h15", text: "Remove saved credentials from shared computers", safe: true, why: "The next user cannot access your account.", tag: "device" },
  { id: "h16", text: "Keep your authentication device secure", safe: true, why: "Your phone is your second factor — protect it with a lock.", tag: "device" },
  { id: "h17", text: "Reuse your company password on shopping websites", safe: false, why: "A shop breach hands attackers your work login.", tag: "reuse" },
  { id: "h18", text: "Share OTPs with colleagues", safe: false, why: "An OTP is a one-time key to your account — never share it.", tag: "sharing" },
  { id: "h19", text: "Save passwords in an unprotected Excel file", safe: false, why: "Anyone who opens or steals the file gets everything.", tag: "storage" },
  { id: "h20", text: "Write passwords on sticky notes", safe: false, why: "Visible to anyone passing your desk.", tag: "storage" },
  { id: "h21", text: "Approve unexpected MFA notifications", safe: false, why: "Lets an attacker straight into your account.", tag: "mfa" },
  { id: "h22", text: "Use your name and birth year as a password", safe: false, why: "Easy to guess from public information.", tag: "strength" },
  { id: "h23", text: "Save company credentials on public computers", safe: false, why: "The next person can log in as you.", tag: "device" },
  { id: "h24", text: "Share passwords through WhatsApp", safe: false, why: "Chats are backed up, forwarded and seen on other devices.", tag: "sharing" },
  { id: "h25", text: "Ignore suspicious login notifications", safe: false, why: "Gives attackers time to steal data.", tag: "report" },
  { id: "h26", text: "Disable MFA for convenience", safe: false, why: "Removes your strongest protection.", tag: "mfa" },
  { id: "h27", text: "Use unauthorised password-management apps", safe: false, why: "Unknown apps may leak or sell your credentials.", tag: "storage" },
  { id: "h28", text: "Share login credentials with external support staff", safe: false, why: "Real support never needs your password.", tag: "sharing" },
  { id: "h29", text: "Store passwords in plain-text documents", safe: false, why: "Readable by anyone or any malware on the device.", tag: "storage" },
  { id: "h30", text: "Use predictable password variations across accounts", safe: false, why: "Attackers try the variations automatically.", tag: "reuse" },
  { id: "h31", text: "Send passwords through personal email", safe: false, why: "Personal mailboxes are outside company protection.", tag: "sharing" },
  { id: "h32", text: "Leave an account logged in on a shared computer", safe: false, why: "Anyone can act as you.", tag: "device" },
  { id: "h33", text: "Use the same password for personal and work accounts", safe: false, why: "A personal breach becomes a company breach.", tag: "reuse" },
  { id: "h34", text: "Share recovery codes with another person", safe: false, why: "Recovery codes bypass MFA completely.", tag: "sharing" },
];

const GOOD_ID = (text: string, why: string) => ({ text, why, points: 4 });
const OK_ID = (text: string, why: string) => ({ text, why, points: 2 });
const BAD_ID = (text: string, why: string) => ({ text, why, points: 0 });

function opts(list: { text: string; why: string; points: number }[], prefix: string): IncidentOption[] {
  return list.map((o, i) => ({ id: `${prefix}${i}`, ...o }));
}

export const INCIDENTS: Incident[] = [
  ["i01", "Compromised Email Account", "Colleagues say they received strange invoice emails from your address that you never sent.", "Outlook: 37 messages sent from your mailbox in the last hour.", ["Sent folder shows emails you didn't write", "A new inbox rule forwards all mail to an external address", "Sign-in from Lagos, NG at 03:12"], "Your mailbox has been taken over by an attacker", "email"],
  ["i02", "Reused Password Exposure", "A news alert says a popular food-delivery site was breached. You used your work password there.", "Have I Been Pwned: your email appears in a new breach.", ["You reused the same password on the delivery site", "Breach data is shared on criminal forums", "Two failed logins on your work account this morning"], "Your work account is at risk from a reused, leaked password", "reuse"],
  ["i03", "Suspicious Login Attempts", "You get emails saying someone tried to sign in to your account multiple times.", "Security alert: 6 failed sign-in attempts.", ["Attempts from three different countries", "All attempts within 10 minutes", "One attempt succeeded on a VPN endpoint"], "Someone is actively trying (and may have managed) to access your account", "login"],
  ["i04", "Unexpected MFA Approval Requests", "While on a call, your phone shows MFA requests you didn't trigger.", "Authenticator: Approve sign-in? (4 requests)", ["You are not signing in anywhere", "Requests come from an unknown device", "A caller then claims to be IT and asks you to approve"], "An attacker has your password and is trying MFA fatigue", "mfa"],
  ["i05", "Stolen Credentials via Fake Page", "Yesterday you entered your password on a 'SharePoint' page from an email link.", "Browser history: sharepoint-docs-login.net", ["The page URL was not the company domain", "Today your password stopped working", "Recovery phone number was changed"], "Your credentials were stolen through a phishing page", "phishing"],
  ["i06", "Unauthorised Access to Files", "Your manager asks why you downloaded the entire client database last night.", "Audit log: 2,400 files downloaded from your account at 01:30.", ["You were asleep at that time", "Download came from a new device", "Your session was never signed out on a shared PC"], "Someone used your account to access company data without authorisation", "access"],
  ["i07", "Suspicious Account Recovery Request", "You receive a text with a recovery code you never asked for.", "SMS: Your Nipun account recovery code is 448210.", ["You didn't request a reset", "A 'support agent' calls asking you to read out the code", "The caller knows your employee ID"], "Someone is trying to take over your account through recovery", "recovery"],
  ["i08", "Multiple Failed Logins & Lockout", "You arrive at work and your account is locked.", "Account locked: too many failed attempts.", ["Over 50 failed logins overnight", "Attempts used passwords like Nipun@2025", "Your colleague's account is locked too"], "Attackers are guessing predictable company passwords", "login"],
  ["i09", "Third-Party Service Compromise", "A project-management tool you signed up for with your work email reports a breach.", "Vendor notice: user passwords may have been exposed.", ["You used a password similar to your work one", "The tool is not company-approved", "Phishing emails referencing the tool are arriving"], "A breach at an outside service puts your work account at risk", "reuse"],
  ["i10", "Suspicious Password-Reset Notification", "You get an email: 'Your password was successfully changed.' You didn't change it.", "Email: Password changed at 11:42 AM.", ["You cannot sign in anymore", "The change came from an unknown IP", "Your MFA method was replaced"], "Your account has been taken over", "recovery"],
  ["i11", "Access from an Unknown Device", "Your account settings show a new device you don't own.", "New sign-in: iPhone 15 · Hyderabad.", ["You use an Android phone", "The device has been active for 2 days", "Unread emails were marked as read"], "An unknown device has persistent access to your account", "device"],
  ["i12", "Credentials Exposed in a Shared Document", "You realise a spreadsheet with team passwords was shared with 'Anyone with the link'.", "Drive: File viewed by 14 external users.", ["The file was named 'logins.xlsx'", "It contains shared admin passwords", "One viewer is an unknown Gmail account"], "Credentials were exposed through an unsafe document", "storage"],
  ["i13", "Activity after Clicking an Unfamiliar Link", "After clicking a 'parcel delivery' link, your mailbox starts behaving oddly.", "Outlook: New forwarding rule created.", ["The link asked for your company login", "Contacts got a similar link from you", "You see logins from an unknown browser"], "Your account was compromised after entering credentials on a malicious link", "phishing"],
  ["i14", "Recovery Information Changed", "You receive an alert that your backup email was changed.", "Security info updated: recovery email → help.desk.verify@gmail.com", ["You didn't make the change", "The new email is not yours", "A sign-in from a new location happened just before"], "An attacker changed your recovery details to lock you out", "recovery"],
].map(([id, title, situation, notification, clues, correct, tag]) => ({
  id: id as string,
  title: title as string,
  situation: situation as string,
  notification: notification as string,
  clues: clues as string[],
  tag: tag as string,
  identify: opts(
    [
      GOOD_ID(correct as string, "This matches the evidence — treat it as a security incident."),
      OK_ID("Probably a technical glitch, but I'll keep an eye on it", "The clues point to an attack; waiting gives the attacker time."),
      BAD_ID("Nothing to worry about — this happens sometimes", "Ignoring clear warning signs lets the compromise continue."),
      BAD_ID("A colleague is probably playing a prank", "Assuming a harmless cause delays the response."),
    ],
    `${id}i`,
  ),
}));

export const GENERIC_STAGES: Omit<IncidentStage, "update">[] = [
  {
    key: "immediate",
    prompt: "What do you do right now?",
    options: opts([
      { text: "Stop, don't approve or click anything, and contact IT Security via the official channel", points: 4, why: "Containing the incident and alerting experts is the safest first step." },
      { text: "Reply to the suspicious messages asking who sent them", points: 0, why: "Engaging the attacker gives them information and wastes time." },
      { text: "Wait until tomorrow to see if it happens again", points: 0, why: "Delays let the attacker steal more data." },
      { text: "Restart your computer and carry on working", points: 1, why: "Restarting does not stop an attacker who has your credentials." },
    ], "im"),
  },
  {
    key: "protect",
    prompt: "How do you protect the affected account?",
    options: opts([
      { text: "Change the password to a new unique passphrase and sign out all sessions (with IT's help)", points: 4, why: "Removes the attacker's access and stops reuse of stolen sessions." },
      { text: "Change the password by adding '1' to the end", points: 1, why: "Predictable variations are guessed quickly." },
      { text: "Turn off MFA so it stops sending prompts", points: 0, why: "Disabling MFA removes your strongest protection." },
      { text: "Share your new password with a colleague for safekeeping", points: 0, why: "Passwords must never be shared." },
    ], "pr"),
  },
  {
    key: "others",
    prompt: "Could other accounts be at risk?",
    options: opts([
      { text: "Yes — change every account that used the same or similar password and enable MFA there", points: 4, why: "Attackers try leaked passwords everywhere (credential stuffing)." },
      { text: "No — only this account was affected", points: 0, why: "Reused passwords put every other account at risk." },
      { text: "Only if I receive alerts from them too", points: 1, why: "Many services never alert you before takeover." },
      { text: "I'll write all my passwords in one notebook to track them", points: 0, why: "A single written list is another exposure risk." },
    ], "ot"),
  },
  {
    key: "report",
    prompt: "How do you report and escalate?",
    options: opts([
      { text: "Report to IT Security with timestamps, alerts and screenshots, and inform your manager", points: 4, why: "Detailed reports help security contain and investigate quickly." },
      { text: "Post about it in the team WhatsApp group", points: 0, why: "Informal channels may leak details and don't reach security." },
      { text: "Delete the alerts so no one thinks you made a mistake", points: 0, why: "Deleting evidence hinders the investigation." },
      { text: "Tell a colleague and let them decide whether to report", points: 1, why: "You are responsible for reporting directly." },
    ], "re"),
  },
];
