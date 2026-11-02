import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Copy,
  Fingerprint,
  Eye,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Lightbulb,
  ListChecks,
  ShieldCheck,
  AlertTriangle,
  BookOpenCheck,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/training/password-security/workshop")({
  component: Workshop,
});

/* ---------------------------------- data ---------------------------------- */

type Strength = "weak" | "moderate" | "strong";
const STRENGTHS: Strength[] = ["weak", "moderate", "strong"];

const STRENGTH_ITEMS: { password: string; correct: Strength; why: string }[] = [
  {
    password: "password123",
    correct: "weak",
    why: "One of the most guessed passwords in the world — attackers try dictionary words plus numbers first.",
  },
  {
    password: "Nipun@2024",
    correct: "weak",
    why: "Company name + current year + a symbol looks clever, but it is one of the very first patterns attackers script against a known company.",
  },
  {
    password: "Summer2024!",
    correct: "moderate",
    why: "Longer with mixed characters, but season + year is a very common pattern — better than a dictionary word, still predictable.",
  },
  {
    password: "Blue!Fox42",
    correct: "moderate",
    why: "Decent mix of characters, but it is short and built from common words. Adding length and randomness would make it much safer.",
  },
  {
    password: "Ravi@1990",
    correct: "weak",
    why: "Name and birth year are easy to find on social media. Attackers build these from your public profiles.",
  },
  {
    password: "Tr7$mQx9#pL2vNq",
    correct: "strong",
    why: "Long, random mix of upper case, lower case, numbers and symbols — not based on any guessable pattern.",
  },
];

const COMMON_MISTAKES = [
  "Using your name, company name, or a child's name plus a year.",
  "Keyboard patterns like Qwerty123 or ABC@123.",
  "A single dictionary word with one swapped letter or symbol.",
  "Reusing the same password with only a small change for each site (Winter1!, Summer1!).",
];

const REUSE_SCENARIO =
  "An employee uses the same password for their company email and an online shopping website. The shopping website experiences a data breach.";

const REUSE_ITEMS = [
  {
    question: "What could happen next?",
    options: [
      "Nothing — the breach only affects the shopping website's customers on that site.",
      "Attackers try the leaked email address and password on the company email account and may get in.",
      "The company email password changes automatically to keep the account safe.",
      "The employee receives a new password by email before anything happens.",
    ],
    correct: 1,
    explanation:
      "This is called credential stuffing: attackers automatically replay every leaked email + password pair against popular services, including corporate mail. If the password was reused, the work account opens too.",
  },
  {
    question: "How could attackers misuse the leaked password?",
    options: [
      "Only look at old shopping orders from the breached website.",
      "Log into the work mailbox, read confidential emails, impersonate the employee to colleagues, and reset passwords for other accounts.",
      "They can only see the email address, not use it for anything.",
      "Nothing, unless the employee also clicks a link in a phishing email.",
    ],
    correct: 1,
    explanation:
      "A mailbox is the master key: password-reset emails for banking, HR and VPN all arrive there. From one reused password an attacker can pivot into many systems and impersonate the employee internally.",
  },
  {
    question: "What would have prevented this situation?",
    options: [
      "Making the shopping password a few characters longer.",
      "Changing the password every single day.",
      "Using a different password for every account — ideally managed in a password manager.",
      "Turning off email notifications on the work account.",
    ],
    correct: 2,
    explanation:
      "A breach on one site must never unlock another account. Unique passwords per account (and MFA as a second layer) contain the damage to the site that was breached.",
  },
];

const MFA_ITEMS = [
  {
    situation: "You type your username and password on the company login page, and an MFA approval request appears on your phone a second later.",
    options: [
      "Approve it — you just initiated this login yourself.",
      "Deny it — MFA prompts should never be approved.",
      "Ignore it and log in again from the start.",
      "Ask a colleague to approve it for you.",
    ],
    correct: 0,
    explanation:
      "Expected behaviour: you started the login, so approving your own prompt is correct. MFA works because it proves the person logging in is holding your phone.",
  },
  {
    situation: "Your phone buzzes with an MFA approval request — but you have not tried to log in to anything.",
    options: [
      "Approve it — maybe IT is testing your account.",
      "Approve it and then change your password.",
      "Deny the request and report the unexpected prompt to IT security.",
      "Ignore it — prompts like this stop by themselves.",
    ],
    correct: 2,
    explanation:
      "An unexpected prompt usually means someone already has your password and MFA is the last thing stopping them. Deny it, then report — approving it would hand over the account.",
  },
  {
    situation: "Several unexpected MFA notifications keep arriving one after another, even after you deny them.",
    options: [
      "Approve one prompt just to make the notifications stop.",
      "Deny every prompt, report it to IT security immediately, and change your password.",
      "Switch your phone to silent and continue working.",
      "Uninstall the authenticator app.",
    ],
    correct: 1,
    explanation:
      "This is an MFA fatigue (push bombing) attack — the attacker spams prompts hoping you approve one by accident to end the noise. Never approve; deny all, report, and change your password.",
  },
  {
    situation: "Someone calling themselves 'IT support' says they need the 6-digit code just sent to your phone to finish fixing your account.",
    options: [
      "Read out the code — IT support is trusted.",
      "Share only the last two digits to be careful.",
      "Take a screenshot of the message and send it to them.",
      "Refuse: real IT never asks for your OTP. End the call and report it through official channels.",
    ],
    correct: 3,
    explanation:
      "The OTP is your second factor — anyone who holds it can finish logging in as you. No legitimate IT team will ever ask for it, over the phone or by email.",
  },
];

const MISTAKE_ITEMS = [
  {
    situation: "Riya keeps her work password on a sticky note attached under her keyboard.",
    options: [
      "Her password is too short.",
      "The password is written down where anyone at her desk can find it.",
      "She does not change her password every week.",
      "She uses letters instead of numbers.",
    ],
    correct: 1,
    explanation:
      "Passwords written near the workstation are readable by cleaners, visitors, and colleagues. Use a password manager instead — that is exactly what it is for.",
  },
  {
    situation: "Amit saves every password in a file called MyPasswords.xlsx on his desktop, with no protection on the file.",
    options: [
      "He used Excel instead of Word.",
      "The passwords sit in plain text that anyone who opens his computer can read.",
      "He did not email the file to himself as a backup.",
      "The file is on the desktop instead of in a folder.",
    ],
    correct: 1,
    explanation:
      "An unprotected file full of passwords is a single point of failure — one malware infection or one curious colleague and every account is exposed. A password manager encrypts all of this behind one master password.",
  },
  {
    situation: "A caller says he is from IT and is fixing Priya's account. Priya reads out the OTP that just arrived on her phone.",
    options: [
      "She answered the phone while working.",
      "She shared her OTP with an unknown caller — the caller can now log in as her.",
      "She was working from home.",
      "She did not use a headset for the call.",
    ],
    correct: 1,
    explanation:
      "The OTP is the final key to the account. Sharing it with a caller — no matter how convincing — is exactly how attackers defeat MFA.",
  },
  {
    situation: "Karan uses one password for his email, the company CRM, and his personal bank account.",
    options: [
      "He has too many accounts.",
      "He reuses one password, so one leak unlocks all three.",
      "He does not use single sign-on.",
      "His username is too simple.",
    ],
    correct: 1,
    explanation:
      "Reused passwords turn one small breach into several. Unique passwords keep a problem contained to the site that was actually breached.",
  },
  {
    situation: "Meera logs into her email on a shared computer in the office reception and saves the password in the browser.",
    options: [
      "She used a browser at all.",
      "She saved her password on a device other people use — the next user can open her account.",
      "She browsed without incognito mode.",
      "The reception Wi-Fi was slow.",
    ],
    correct: 1,
    explanation:
      "Never save passwords on shared or public computers. Anyone using that device next can retrieve them from the browser.",
  },
];

const SCENARIO_ITEMS: (MCQ | TF)[] = [
  {
    kind: "mcq",
    scenario:
      "While on holiday you checked your work email from an internet café. A week later you receive an alert: your account was signed in from another country.",
    question: "What is the appropriate response?",
    options: [
      "Wait and see whether it happens again.",
      "Delete the alert email so it does not worry anyone.",
      "Change your password immediately from a trusted device and report the sign-in to IT security.",
      "Change your password back to the one you used before.",
    ],
    correct: 2,
    explanation:
      "An unfamiliar sign-in means assume compromise: change the password from a device you trust, sign out other sessions if the option exists, and let IT investigate.",
  },
  {
    kind: "mcq",
    scenario:
      "The news reports that a shopping website you use was breached. Your work email password is different, but you used the same password on two other websites.",
    question: "What should you do?",
    options: [
      "Change the password on the breached shopping site only.",
      "Ignore it — the breach is that website's problem.",
      "Ask your friends whether their accounts still work.",
      "Change that password everywhere you reused it, and turn on MFA where it is offered.",
    ],
    correct: 3,
    explanation:
      "Leaked passwords are replayed against other services within hours. Changing it everywhere it was reused — and adding MFA — closes every door the leak could open.",
  },
  {
    kind: "mcq",
    scenario:
      "At 11:30 pm your phone receives repeated MFA approval requests for your work account. You are in bed and did not attempt any login.",
    question: "What is the safest response?",
    options: [
      "Approve one prompt so the notifications stop and you can sleep.",
      "Deny every prompt, do not approve anything, and report it to IT security first thing — or immediately if the prompts continue.",
      "Turn off the phone and deal with it next week.",
      "Reply to the notification asking who it is.",
    ],
    correct: 1,
    explanation:
      "Night-time prompt floods are a classic MFA fatigue attack. The attacker bets on you approving one to stop the noise. Deny all, never approve, and report — your password is likely already compromised.",
  },
  {
    kind: "tf",
    question: "It is safe to approve an MFA request as long as the notification looks official and comes from your company's app.",
    answer: false,
    explanation:
      "The prompt itself cannot tell you who is logging in — only that someone entered your password. If you did not initiate the login, the request is suspicious no matter how official it looks.",
  },
  {
    kind: "tf",
    question: "A password manager lets you use a different, strong password for every account while remembering only one master password.",
    answer: true,
    explanation:
      "Exactly. The manager generates and stores the unique passwords; you only need to remember — and protect — one strong master password.",
  },
];

type MCQ = {
  kind: "mcq";
  scenario: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};
type TF = { kind: "tf"; question: string; answer: boolean; explanation: string };

const QUIZ: (MCQ & { topic: string })[] = [
  {
    kind: "mcq",
    scenario: "During password training you are shown four passwords. Which one is the strongest?",
    question: "Which password is the strongest?",
    options: ["Nipun@2024", "Summer2024!", "qwerty#123", "7k$Wm2#vQ9xLp"],
    correct: 3,
    explanation:
      "It is long and random — no name, year, or keyboard pattern for attackers to guess first.",
    topic: "password strength",
  },
  {
    kind: "mcq",
    scenario: "You use your work email password on a shopping site, and that site announces a data breach.",
    question: "What should you do first?",
    options: [
      "Wait — the breach does not involve your employer directly.",
      "Change your work email password immediately and make sure MFA is switched on.",
      "Change the shopping site password next month when you next shop there.",
      "Ask IT to change your password for you at the end of the week.",
    ],
    correct: 1,
    explanation:
      "Attackers replay leaked credentials within hours. If the password is shared with your work account, the clock starts immediately.",
    topic: "password reuse",
  },
  {
    kind: "mcq",
    scenario: "A caller claiming to be from IT support says they need the OTP just sent to your phone to complete an account fix.",
    question: "What is the safest response?",
    options: [
      "Read out the code — IT support is a trusted team.",
      "Share only the last two digits of the code.",
      "Refuse to share it and report the call through official IT channels.",
      "Send a screenshot of the OTP message so they can verify it.",
    ],
    correct: 2,
    explanation:
      "No legitimate IT team ever asks for your OTP. Sharing it completes their login as you.",
    topic: "OTP security",
  },
  {
    kind: "mcq",
    scenario: "A new colleague asks what MFA actually protects against.",
    question: "What does MFA add to your account?",
    options: [
      "A longer, more complicated password.",
      "A second proof of identity, so a stolen password alone is not enough.",
      "Antivirus protection for the account.",
      "A faster way to sign in.",
    ],
    correct: 1,
    explanation:
      "MFA requires something you have (your phone) or something you are, in addition to something you know. A leaked password stops being sufficient.",
    topic: "MFA basics",
  },
  {
    kind: "mcq",
    scenario: "An MFA approval request appears on your phone while you are in a meeting. You did not start a login.",
    question: "What should you do?",
    options: [
      "Approve it — you may have left a tab open somewhere.",
      "Approve it first, then change your password afterwards.",
      "Deny it and report the unexpected request to IT security.",
      "Ignore it — repeated prompts stop eventually.",
    ],
    correct: 2,
    explanation:
      "You did not initiate a login, so someone else did. Deny, report — approval hands over the account.",
    topic: "unexpected MFA prompts",
  },
  {
    kind: "mcq",
    scenario: "Your team is discussing how to keep track of many different account passwords.",
    question: "What is the main benefit of a password manager?",
    options: [
      "It writes your passwords into a notes file for safekeeping.",
      "It generates and stores a unique strong password per site, so you only remember one master password.",
      "It shares your passwords with the IT department automatically.",
      "It lets you use the same simple password everywhere more safely.",
    ],
    correct: 1,
    explanation:
      "Unique passwords everywhere, zero memorisation burden — the manager does the remembering.",
    topic: "password managers",
  },
  {
    kind: "mcq",
    scenario: "You are reviewing what a compromised account looks like.",
    question: "Which of these is a common sign that an account has been compromised?",
    options: [
      "The mailbox loads slightly faster than usual.",
      "A sign-in alert from a location or device you do not recognise.",
      "You start receiving more newsletters than before.",
      "The browser remembers your password automatically.",
    ],
    correct: 1,
    explanation:
      "Unfamiliar sign-in alerts are the clearest signal — treat them as an incident, not a nuisance.",
    topic: "account compromise",
  },
  {
    kind: "mcq",
    scenario: "You have twelve work and personal accounts to look after.",
    question: "What is the safest setup for all of these accounts?",
    options: [
      "One very strong password reused everywhere, so it is easy to remember.",
      "A unique password for each account, with MFA switched on for the important ones.",
      "All passwords saved in the browser of a shared office computer.",
      "All passwords written in a notebook kept in your desk drawer.",
    ],
    correct: 1,
    explanation:
      "Unique per account, MFA as the second layer — a breach on one service stays on that service.",
    topic: "password hygiene",
  },
  {
    kind: "mcq",
    scenario: "A colleague whose account is locked asks to borrow your login 'just for a day'.",
    question: "How should you respond?",
    options: [
      "Share the password — it will help them work.",
      "Share it, but watch what they do with it.",
      "Decline — accounts are personal — and point them to IT support to restore their access.",
      "Share your OTP instead of the password, since it expires quickly.",
    ],
    correct: 2,
    explanation:
      "Your account carries your name and your access. Anything done under it is attributed to you — and 'just for a day' is how sharing incidents start.",
    topic: "credential sharing",
  },
  {
    kind: "mcq",
    scenario: "You suspect you typed your password on a computer that had a keylogger installed.",
    question: "What should you do first?",
    options: [
      "Nothing — your password is strong enough to resist.",
      "Change the password from a trusted device and report the incident to IT security.",
      "Clear the browser history on that computer to be safe.",
      "Reuse an older password that you remember well.",
    ],
    correct: 1,
    explanation:
      "Assume the password is known to the attacker. Change it from a trusted device immediately and report so IT can check for misuse.",
    topic: "account compromise",
  },
];

const TAKEAWAYS = [
  { title: "Use strong and unique passwords.", body: "A different password for every account, long and not guessable." },
  { title: "Never share passwords or OTPs.", body: "No real IT team, bank, or colleague will ever need them." },
  { title: "Enable MFA wherever required.", body: "It is the single biggest protection for your accounts." },
  { title: "Deny unexpected MFA requests.", body: "If you did not start the login, do not approve the prompt." },
  { title: "Report suspicious login activity immediately.", body: "Fast reporting turns a break-in attempt into a small event." },
];

/* --------------------------------- page ----------------------------------- */

const STEPS = [
  { title: "Password Strength", icon: KeyRound },
  { title: "Password Reuse", icon: Copy },
  { title: "MFA Approvals", icon: Fingerprint },
  { title: "Spot the Mistake", icon: Eye },
  { title: "Attack Scenarios", icon: Search },
  { title: "Final Assessment", icon: ListChecks },
];

function Workshop() {
  const { profile } = useAuth();
  const [step, setStep] = useState(0); // 0-4 activities, 5 quiz, 6 results

  // Activity answers
  const [a1, setA1] = useState<(Strength | null)[]>(Array(STRENGTH_ITEMS.length).fill(null));
  const [a2, setA2] = useState<(number | null)[]>(Array(REUSE_ITEMS.length).fill(null));
  const [a3, setA3] = useState<(number | null)[]>(Array(MFA_ITEMS.length).fill(null));
  const [a4, setA4] = useState<(number | null)[]>(Array(MISTAKE_ITEMS.length).fill(null));
  const [a5, setA5] = useState<(number | boolean | null)[]>(
    SCENARIO_ITEMS.map((i) => (i.kind === "mcq" ? null : null))
  );
  const [quiz, setQuiz] = useState<(number | null)[]>(Array(QUIZ.length).fill(null));
  const [result, setResult] = useState<{ score: number; answers: (number | null)[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const completed = [
    a1.every((x) => x !== null),
    a2.every((x) => x !== null),
    a3.every((x) => x !== null),
    a4.every((x) => x !== null),
    a5.every((x) => x !== null),
    result !== null,
  ];

  function reset() {
    setA1(Array(STRENGTH_ITEMS.length).fill(null));
    setA2(Array(REUSE_ITEMS.length).fill(null));
    setA3(Array(MFA_ITEMS.length).fill(null));
    setA4(Array(MISTAKE_ITEMS.length).fill(null));
    setA5(SCENARIO_ITEMS.map(() => null));
    setQuiz(Array(QUIZ.length).fill(null));
    setResult(null);
    setStep(0);
  }

  async function submitQuiz() {
    const answers = [...quiz];
    const score = QUIZ.reduce((acc, q, i) => (answers[i] === q.correct ? acc + 1 : acc), 0);
    setSubmitting(true);
    try {
      if (profile?.id) {
        const { error } = await supabase.from("password_mfa_results").insert({
          user_id: profile.id,
          completed_activities: ["strength", "reuse", "mfa-approvals", "spot-mistake", "scenarios"],
          quiz_answers: answers,
          score,
          total: QUIZ.length,
        });
        if (error) throw error;
      }
      setResult({ score, answers });
      setStep(6);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save your result — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const quizAnswered = quiz.every((x) => x !== null);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/training/password-security"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> Back to overview
        </Link>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Restart module
        </button>
      </div>

      <span className="chip mt-4">PASSWORD SECURITY &amp; MFA AWARENESS</span>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">Interactive Workshop</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Fictional examples only — never enter a real password, OTP, or company information.
      </p>

      {/* Progress indicator */}
      <div className="soc-card mt-6 p-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-muted-foreground">
            Progress
          </span>
          <span className="mono text-muted-foreground">
            {completed.filter(Boolean).length}/{completed.length} completed
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(completed.filter(Boolean).length / completed.length) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {STEPS.map((s, i) => {
            const done = completed[i];
            const current = step === i && step < 6;
            return (
              <button
                key={s.title}
                onClick={() => setStep(i)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] transition ${
                  current
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : done
                      ? "border-border bg-muted/60 text-foreground"
                      : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-3 w-3 text-primary" />
                ) : (
                  <s.icon className="h-3 w-3" />
                )}
                {i + 1}. {s.title}
              </button>
            );
          })}
          {result && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              <Trophy className="h-3 w-3" /> Result
            </span>
          )}
        </div>
      </div>

      {/* Steps */}
      {step === 0 && (
        <ActivityShell
          step={0}
          title="Password Strength Challenge"
          intro="Classify each fictional password as weak, moderate, or strong. Click a classification to answer."
          onNext={() => setStep(1)}
          nextLabel="Next: Password Reuse Challenge"
        >
          {STRENGTH_ITEMS.map((item, i) => (
            <div key={i} className="soc-card p-5">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <span className="mono rounded bg-muted px-2 py-1 text-sm">{item.password}</span>
              </div>
              <StrengthOptions
                selected={a1[i]}
                onSelect={(s) => setA1((prev) => prev.map((v, j) => (j === i ? s : v)))}
              />
              {a1[i] !== null && (
                <Feedback correct={a1[i] === item.correct} explanation={item.why} />
              )}
            </div>
          ))}
          <NoteCard icon={Lightbulb} title="Common password mistakes to avoid">
            <ul className="list-disc space-y-1 pl-5">
              {COMMON_MISTAKES.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </NoteCard>
        </ActivityShell>
      )}

      {step === 1 && (
        <ActivityShell
          step={1}
          title="Password Reuse Challenge"
          intro="Read the scenario, then answer the three questions."
          onNext={() => setStep(2)}
          nextLabel="Next: MFA Approval Challenge"
        >
          <div className="soc-card border-l-2 border-l-accent p-5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-accent" />
              <p className="text-sm font-medium">{REUSE_SCENARIO}</p>
            </div>
          </div>
          {REUSE_ITEMS.map((item, i) => (
            <McqCard
              key={i}
              index={i + 1}
              question={item.question}
              options={item.options}
              selected={a2[i]}
              onSelect={(o) => setA2((prev) => prev.map((v, j) => (j === i ? o : v)))}
              correct={item.correct}
              explanation={item.explanation}
            />
          ))}
        </ActivityShell>
      )}

      {step === 2 && (
        <ActivityShell
          step={2}
          title="MFA Approval Challenge"
          intro="For each situation, choose the safest response."
          onNext={() => setStep(3)}
          nextLabel="Next: Spot the Security Mistake"
        >
          {MFA_ITEMS.map((item, i) => (
            <McqCard
              key={i}
              index={i + 1}
              situation={item.situation}
              question="What is the safest response?"
              options={item.options}
              selected={a3[i]}
              onSelect={(o) => setA3((prev) => prev.map((v, j) => (j === i ? o : v)))}
              correct={item.correct}
              explanation={item.explanation}
            />
          ))}
        </ActivityShell>
      )}

      {step === 3 && (
        <ActivityShell
          step={3}
          title="Spot the Security Mistake"
          intro="Everyday workplace situations. Pick the main security mistake in each."
          onNext={() => setStep(4)}
          nextLabel="Next: Real-World Attack Scenarios"
        >
          {MISTAKE_ITEMS.map((item, i) => (
            <McqCard
              key={i}
              index={i + 1}
              situation={item.situation}
              question="What is the main security mistake here?"
              options={item.options}
              selected={a4[i]}
              onSelect={(o) => setA4((prev) => prev.map((v, j) => (j === i ? o : v)))}
              correct={item.correct}
              explanation={item.explanation}
            />
          ))}
        </ActivityShell>
      )}

      {step === 4 && (
        <ActivityShell
          step={4}
          title="Real-World Attack Scenarios"
          intro="Five realistic situations. Choose the appropriate response — the last two are True/False."
          onNext={() => setStep(5)}
          nextLabel="Go to Final Assessment"
        >
          {SCENARIO_ITEMS.map((item, i) =>
            item.kind === "mcq" ? (
              <McqCard
                key={i}
                index={i + 1}
                situation={item.scenario}
                question={item.question}
                options={item.options}
                selected={a5[i] as number | null}
                onSelect={(o) => setA5((prev) => prev.map((v, j) => (j === i ? o : v)))}
                correct={item.correct}
                explanation={item.explanation}
              />
            ) : (
              <TfCard
                key={i}
                index={i + 1}
                question={item.question}
                selected={a5[i] as boolean | null}
                onSelect={(o) => setA5((prev) => prev.map((v, j) => (j === i ? o : v)))}
                answer={item.answer}
                explanation={item.explanation}
              />
            )
          )}
        </ActivityShell>
      )}

      {step === 5 && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold tracking-tight">Final Knowledge Assessment</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            10 scenario-based questions. Choose the best answer for each, then submit. You will
            see the correct answer and an explanation for every question afterwards.
          </p>
          <div className="mt-6 space-y-3">
            {QUIZ.map((item, i) => (
              <div key={i} className="soc-card p-5">
                <div className="flex items-start gap-2">
                  <span className="mono mt-0.5 text-xs text-muted-foreground">Q{i + 1}</span>
                  <div className="text-sm">
                    {item.scenario && <p className="text-muted-foreground">{item.scenario}</p>}
                    <p className="mt-1 font-medium">{item.question}</p>
                  </div>
                </div>
                <div className="mt-3 grid gap-2">
                  {item.options.map((opt, oi) => {
                    const picked = quiz[i] === oi;
                    return (
                      <button
                        key={oi}
                        onClick={() => setQuiz((prev) => prev.map((v, j) => (j === i ? oi : v)))}
                        className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                          picked
                            ? "border-primary bg-primary/10 text-foreground font-medium"
                            : "border-border text-foreground/80 hover:bg-muted"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button
              disabled={!quizAnswered || submitting}
              onClick={submitQuiz}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Assessment"}
              <ArrowRight className="h-4 w-4" />
            </button>
            {!quizAnswered && (
              <span className="text-xs text-muted-foreground">
                Answer all {QUIZ.length} questions to submit.
              </span>
            )}
          </div>
        </div>
      )}

      {step === 6 && result && (
        <ResultView
          score={result.score}
          total={QUIZ.length}
          answers={result.answers}
          onRestart={reset}
        />
      )}
    </div>
  );
}

/* ------------------------------- sub views -------------------------------- */

function ActivityShell({
  step,
  title,
  intro,
  children,
  onNext,
  nextLabel,
}: {
  step: number;
  title: string;
  intro: string;
  children: React.ReactNode;
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2">
        <span className="mono text-xs text-muted-foreground">ACTIVITY {step + 1}</span>
      </div>
      <h2 className="mt-1 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{intro}</p>
      <div className="mt-6 space-y-3">{children}</div>
      <button
        onClick={onNext}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {nextLabel} <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function StrengthOptions({
  selected,
  onSelect,
}: {
  selected: Strength | null;
  onSelect: (s: Strength) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {STRENGTHS.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className={`rounded-md border px-3 py-1.5 text-xs font-medium capitalize transition ${
            selected === s
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function McqCard({
  index,
  situation,
  question,
  options,
  selected,
  onSelect,
  correct,
  explanation,
}: {
  index?: number;
  situation?: string;
  question: string;
  options: string[];
  selected: number | null;
  onSelect: (o: number) => void;
  correct: number;
  explanation: string;
}) {
  return (
    <div className="soc-card p-5">
      <div className="text-sm">
        {situation && <p className="text-muted-foreground">{situation}</p>}
        <p className="mt-1 font-medium">
          {index && <span className="mono mr-1.5 text-xs text-muted-foreground">{index}.</span>}
          {question}
        </p>
      </div>
      <div className="mt-3 grid gap-2">
        {options.map((opt, oi) => {
          const picked = selected === oi;
          return (
            <button
              key={oi}
              onClick={() => onSelect(oi)}
              className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                picked
                  ? "border-primary bg-primary/10 text-foreground font-medium"
                  : "border-border text-foreground/80 hover:bg-muted"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <Feedback correct={selected === correct} explanation={explanation} />
      )}
    </div>
  );
}

function TfCard({
  index,
  question,
  selected,
  onSelect,
  answer,
  explanation,
}: {
  index?: number;
  question: string;
  selected: boolean | null;
  onSelect: (v: boolean) => void;
  answer: boolean;
  explanation: string;
}) {
  return (
    <div className="soc-card p-5">
      <p className="text-sm font-medium">
        {index && <span className="mono mr-1.5 text-xs text-muted-foreground">{index}.</span>}
        True or False: {question}
      </p>
      <div className="mt-3 flex gap-2">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            onClick={() => onSelect(v)}
            className={`rounded-md border px-4 py-1.5 text-sm font-medium transition ${
              selected === v
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {v ? "True" : "False"}
          </button>
        ))}
      </div>
      {selected !== null && (
        <Feedback correct={selected === answer} explanation={explanation} />
      )}
    </div>
  );
}

function Feedback({ correct, explanation }: { correct: boolean; explanation: string }) {
  return (
    <div
      className={`mt-3 rounded-md border p-3 text-xs ${
        correct
          ? "border-primary/30 bg-primary/5 text-foreground/90"
          : "border-border bg-muted text-foreground/90"
      }`}
    >
      <div className="flex items-center gap-1.5 font-semibold">
        {correct ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Correct
          </>
        ) : (
          <>
            <XCircle className="h-3.5 w-3.5 text-destructive" /> Not quite — here is why
          </>
        )}
      </div>
      <p className="mt-1 leading-relaxed">{explanation}</p>
    </div>
  );
}

function NoteCard({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="soc-card p-5">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold uppercase tracking-wider">{title}</span>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">{children}</div>
    </div>
  );
}

function ResultView({
  score,
  total,
  answers,
  onRestart,
}: {
  score: number;
  total: number;
  answers: (number | null)[];
  onRestart: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const level =
    score >= 9
      ? { label: "Security Champion", tone: "chip-success" }
      : score >= 7
        ? { label: "Strong Awareness", tone: "chip-success" }
        : score >= 5
          ? { label: "Developing Awareness", tone: "chip-warn" }
          : { label: "Needs Improvement", tone: "chip-danger" };

  const missed = QUIZ.map((q, i) => ({ q, i, ok: answers[i] === q.correct })).filter((x) => !x.ok);
  const got = QUIZ.map((q, i) => ({ q, ok: answers[i] === q.correct })).filter((x) => x.ok);

  return (
    <div className="mt-8">
      {/* Score */}
      <div className="soc-card p-6 text-center">
        <BookOpenCheck className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-2 text-xl font-semibold tracking-tight">Workshop Complete!</h2>
        <div className="mono mt-3 text-4xl font-semibold">
          {score}
          <span className="text-lg text-muted-foreground">/{total}</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className={`chip ${level.tone}`}>{level.label}</span>
          <span className="chip">{pct}%</span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          You have completed the Password Security &amp; MFA Awareness workshop. Your result has
          been saved to your training record.
        </p>
      </div>

      {/* Personalized feedback */}
      <div className="soc-card mt-4 p-6">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Personalized learning feedback</h3>
        </div>
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <b className="text-foreground">Strengths.</b>{" "}
            <span className="text-muted-foreground">
              {got.length > 0
                ? `You answered ${got.length} of ${total} questions correctly${
                    got.length >= 8 ? " — excellent judgement across password and MFA situations." : "."
                  }`
                : "You completed every activity — revisiting them before retaking the quiz will build a strong base."}
            </span>
          </div>
          <div>
            <b className="text-foreground">Areas to review.</b>{" "}
            <span className="text-muted-foreground">
              {missed.length === 0
                ? "None — every assessment question was correct."
                : missed
                    .slice(0, 4)
                    .map((m) => m.q.topic)
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .join(", ")}
              {missed.length > 0 ? "." : ""}
            </span>
          </div>
          <div>
            <b className="text-foreground">Security best practices.</b>{" "}
            <span className="text-muted-foreground">
              Use a password manager with a unique password per account, switch on MFA for every
              important account, and treat any unexpected MFA prompt or OTP request as an attack
              until proven otherwise.
            </span>
          </div>
          <div>
            <b className="text-foreground">Recommendation.</b>{" "}
            <span className="text-muted-foreground">
              {missed.length === 0
                ? "Share what you learned with your team — password hygiene is a team sport."
                : missed.length <= 3
                  ? "Revisit the activities above for the topics listed, then restart the module to improve your result."
                  : "Restart the module and go through each activity again — the feedback in every activity explains exactly what to look for."}
            </span>
          </div>
        </div>
      </div>

      {/* Answer review */}
      <h3 className="mt-8 flex items-center gap-2 text-lg font-semibold">
        <ShieldCheck className="h-4 w-4 text-primary" /> Your answers, reviewed
      </h3>
      <div className="mt-3 space-y-3">
        {QUIZ.map((q, i) => {
          const ok = answers[i] === q.correct;
          return (
            <div key={i} className="soc-card p-5">
              <div className="flex items-start gap-2">
                {ok ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                )}
                <div className="text-sm">
                  <p className="text-muted-foreground">{q.scenario}</p>
                  <p className="mt-1 font-medium">{q.question}</p>
                  <p className="mt-2 text-xs">
                    <span className="text-muted-foreground">Your answer:</span>{" "}
                    <span className={ok ? "text-foreground" : "text-destructive"}>
                      {answers[i] !== null ? q.options[answers[i]!] : "—"}
                    </span>
                  </p>
                  {!ok && (
                    <p className="mt-1 text-xs">
                      <span className="text-muted-foreground">Correct answer:</span>{" "}
                      <span className="font-medium text-foreground">{q.options[q.correct]}</span>
                    </p>
                  )}
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{q.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Final takeaways */}
      <h3 className="mt-8 flex items-center gap-2 text-lg font-semibold">
        <Trophy className="h-4 w-4 text-primary" /> Five practices to remember
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {TAKEAWAYS.map((t, i) => (
          <div key={i} className="soc-card p-4">
            <div className="flex items-center gap-2">
              <span className="mono grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <span className="text-sm font-semibold">{t.title}</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{t.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <RotateCcw className="h-4 w-4" /> Restart module
        </button>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
        >
          Back to training <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
