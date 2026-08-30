import React, { useState, useMemo, useEffect, useRef } from "react";
import { FlaskConical, Activity, ShieldAlert, ShieldCheck, ShieldQuestion, Dumbbell, UtensilsCrossed, Clock, Wallet, CalendarDays, Target, ChevronDown, AlertTriangle, CheckCircle2, Circle, ArrowRight } from "lucide-react";

const TOKENS = {
  ink: "#1E2B26",
  paper: "#F5F3ED",
  card: "#EFEBDF",
  line: "#D8D2C0",
  evergreen: "#35604B",
  evergreenDeep: "#264939",
  evergreenBright: "#4A8066",
  amber: "#B8863B",
  brick: "#A8503A",
  cream: "#FBFAF6",
};

// Decorative amino-acid-chain motif — echoes the subject without being a literal diagram.
function ChainMotif({ className = "", nodeCount = 9, stroke = TOKENS.evergreen, animate = true }) {
  const pts = Array.from({ length: nodeCount }).map((_, i) => {
    const x = (i / (nodeCount - 1)) * 100;
    const y = 50 + Math.sin(i * 1.1) * 26;
    return { x, y };
  });
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="none" style={{ overflow: "visible" }}>
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="0.6"
        strokeLinecap="round"
        style={
          animate
            ? { strokeDasharray: 140, strokeDashoffset: 140, animation: "pg-draw 1.8s ease forwards 0.2s" }
            : undefined
        }
      />
      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i % 3 === 0 ? 2.4 : 1.4}
          fill={i % 3 === 0 ? stroke : TOKENS.cream}
          stroke={stroke}
          strokeWidth="0.5"
          style={
            animate
              ? { opacity: 0, animation: `pg-pop 0.4s ease forwards ${0.3 + i * 0.12}s` }
              : undefined
          }
        />
      ))}
    </svg>
  );
}

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";

function useFonts() {
  const [loaded, setLoaded] = useState(false);
  React.useEffect(() => {
    if (document.getElementById("pg-fonts")) { setLoaded(true); return; }
    const link = document.createElement("link");
    link.id = "pg-fonts";
    link.rel = "stylesheet";
    link.href = FONT_LINK;
    link.onload = () => setLoaded(true);
    document.head.appendChild(link);
  }, []);
  return loaded;
}

const TIERS = [
  {
    id: 1,
    label: "Tier 01",
    name: "Approved & trial-backed",
    color: TOKENS.evergreen,
    icon: ShieldCheck,
    summary:
      "Passed controlled human trials, FDA-approved for a specific use, and prescribed with monitoring.",
    examples: [
      { name: "Semaglutide / tirzepatide (GLP-1s)", note: "Approved for type 2 diabetes and, at certain doses, weight management." },
      { name: "Insulin", note: "The original therapeutic peptide, approved for over a century." },
      { name: "Bremelanotide (PT-141)", note: "Approved for hypoactive sexual desire disorder in premenopausal women." },
      { name: "Recombinant growth hormone", note: "Approved only for diagnosed deficiency, under endocrinology supervision." },
    ],
    takeaway: "These went through the process. Real trials, known dosing, a doctor tracking labs. This is what 'peptide therapy' should look like.",
  },
  {
    id: 2,
    label: "Tier 02",
    name: "Some human data, prescribed off-label",
    color: TOKENS.amber,
    icon: ShieldQuestion,
    summary:
      "Limited controlled trials in humans. Sometimes prescribed off-label by specialists who monitor bloodwork, but not FDA-approved for the way they're being marketed.",
    examples: [
      { name: "Sermorelin", note: "Some trial history as a growth-hormone secretagogue; used off-label, rarely with rigorous monitoring outside specialty clinics." },
      { name: "Ipamorelin", note: "One controlled human trial; commonly stacked with other peptides without data on the combination." },
      { name: "PT-141 (off-label uses)", note: "Approved for one indication, but often marketed more broadly than the label supports." },
    ],
    takeaway: "Not baseless, but thinner evidence than people assume. 'A clinic offers it' is not the same as 'it's proven safe long-term.'",
  },
  {
    id: 3,
    label: "Tier 03",
    name: "Grey-market, minimal-to-no human data",
    color: TOKENS.brick,
    icon: ShieldAlert,
    summary:
      "Sold as 'research use only' to skip FDA oversight. No reliable data on long-term safety, purity, or correct dosing in humans.",
    examples: [
      { name: "BPC-157", note: "Animal and in-vitro data only. No controlled human trials for injury repair." },
      { name: "CJC-1295 (with or without DAC)", note: "Failed to advance through clinical trials as a drug candidate." },
      { name: "TB-500", note: "Marketed for healing; human safety data is essentially absent." },
      { name: "Melanotan I / II", note: "Associated with reported GI distress, and darkening of moles — a monitoring concern." },
    ],
    takeaway: "This is most of what's trending on social media. 'Research use only' on the label is a warning, not a loophole.",
  },
];

const REDFLAGS = [
  "Sold or recommended by someone with a financial stake in you buying it (coach, influencer, unlicensed 'clinic').",
  "Labeled 'not for human consumption' or 'research use only' — that's a liability disclaimer, not a technicality.",
  "No bloodwork before starting, and none planned during use.",
  "Vague on exact compound, dose, or sourcing when asked directly.",
  "Framed as risk-free because it's 'natural' or 'just a peptide, not a steroid.'",
];

const GOOD_QUESTIONS = [
  "What controlled human trials exist for this specific compound — not the category, this one?",
  "Who is monitoring my bloodwork before, during, and after?",
  "What does the source's quality control / purity testing look like?",
  "What's the plan if I have an adverse reaction, and who is reachable if I do?",
  "Is there an approved alternative that does what I'm actually trying to achieve?",
];

// ---------- Plan builder logic ----------

const TIME_OPTIONS = [
  { id: "low", label: "15–20 min", days: "3x/week", detail: "Short sessions, most days skipped by life." },
  { id: "mid", label: "30–45 min", days: "3–4x/week", detail: "A real but tight window most days." },
  { id: "high", label: "45–60+ min", days: "4–5x/week", detail: "Consistent, protected training time." },
];

const BUDGET_OPTIONS = [
  { id: "lean", label: "Lean", detail: "Cost-conscious staples, minimal waste." },
  { id: "mid", label: "Moderate", detail: "Some convenience and variety built in." },
  { id: "flex", label: "Flexible", detail: "Quality and convenience over cost." },
];

const SCHEDULE_OPTIONS = [
  { id: "desk", label: "Desk job, fixed hours" },
  { id: "shift", label: "Shift work / irregular hours" },
  { id: "caregiver", label: "Caregiving / parenting-heavy" },
  { id: "student", label: "Student, variable blocks" },
];

const GOAL_OPTIONS = [
  { id: "energy", label: "More energy, fewer crashes" },
  { id: "strength", label: "Build strength / muscle" },
  { id: "composition", label: "Shift body composition" },
  { id: "foundation", label: "Just build a sustainable baseline" },
];

function buildTraining(time, schedule, goal) {
  const base = {
    low: {
      structure: "2 full-body strength sessions + 1 short walk-or-move session",
      session: "One compound lift or circuit (squat/hinge/push/pull pattern), 15–20 min, no warmup wasted on fluff — 5 min mobility, straight into working sets.",
    },
    mid: {
      structure: "3 full-body strength sessions, one optional easy cardio add-on",
      session: "4–5 exercises covering push, pull, hinge, squat, carry. 30–45 min including warmup.",
    },
    high: {
      structure: "4–5 sessions: upper/lower split or push-pull-legs, plus dedicated conditioning",
      session: "Full warmup, primary lift, 2–3 accessory movements, optional finisher. 45–60+ min.",
    },
  }[time];

  const scheduleNote = {
    desk: "Anchor sessions to a fixed slot (before work or lunch) since your hours are predictable — protect it like a meeting.",
    shift: "Skip fixed days. Plan by 'the next day I'm awake and it's been under 48 hours since I last trained,' not by calendar day.",
    caregiver: "Keep equipment minimal (bands, one set of dumbbells, bodyweight) so a session can happen at home in short windows, interrupted or not.",
    student: "Batch sessions around class blocks. A gym close to campus beats a better gym that's a detour.",
  }[schedule];

  const goalNote = {
    energy: "Bias toward consistency over intensity — a short, un-skippable session beats an ambitious one you dread.",
    strength: "Prioritize progressive overload on 3–4 compound patterns; track weight/reps so progress is visible.",
    composition: "Keep strength training as the anchor; body composition follows consistent training + nutrition, not extra cardio volume.",
    foundation: "Focus purely on showing up and owning the movement patterns — weight and intensity come later.",
  }[goal];

  return { ...base, scheduleNote, goalNote };
}

function buildNutrition(budget, schedule, goal) {
  const base = {
    lean: {
      framework: "Build meals around: 1 cheap protein (eggs, canned fish, chicken thighs, beans, lentils), 1 bulk carb (rice, oats, potatoes), and whatever produce is on sale.",
      shopping: "Shop a short weekly list, buy protein in bulk when on sale, lean on frozen vegetables (same nutrition, no waste).",
    },
    mid: {
      framework: "Same protein-first plate method, with more variety — rotate 3–4 proteins and a wider produce list through the week.",
      shopping: "One bigger weekly shop plus a mid-week top-up for fresh items.",
    },
    flex: {
      framework: "Protein-first plate method, with room for higher-quality cuts, pre-prepped items, or a meal delivery to fill gaps on the busiest days.",
      shopping: "Mix grocery shopping with a couple of convenience meals on your busiest 1–2 days, so nutrition doesn't collapse when time does.",
    },
  }[budget];

  const scheduleNote = {
    desk: "Prep 2–3 lunches in advance so decision fatigue doesn't default to whatever's closest to the office.",
    shift: "Keep a stocked 'grab bag' (protein source + carb + produce) ready regardless of what time you wake up — hunger won't wait for a normal schedule.",
    caregiver: "Cook once, eat twice: double dinner portions deliberately so lunch the next day is already done.",
    student: "Keep a short list of 10-minute meals you can make between classes — variety matters less than not skipping meals.",
  }[schedule];

  const goalNote = {
    energy: "Prioritize protein and fiber at breakfast — it's the meal most likely to get skipped or turned into just caffeine.",
    strength: "Aim for a palm-to-two-palms of protein at each meal; muscle is built on consistent intake, not one big post-workout meal.",
    composition: "Build the plate protein-and-produce-first, then fill the rest with carbs/fats to appetite — no need to count grams to see change.",
    foundation: "Start with just hitting 3 real meals a day before optimizing anything else.",
  }[goal];

  return { ...base, scheduleNote, goalNote };
}

const EXPERIENCE_OPTIONS = [
  { id: "new", label: "New to training", detail: "Little to no consistent gym history." },
  { id: "some", label: "Some experience", detail: "On and off for a year or more." },
  { id: "experienced", label: "Experienced", detail: "Trained consistently for years." },
];

const EQUIPMENT_OPTIONS = [
  { id: "none", label: "Bodyweight only", detail: "No equipment, home or anywhere." },
  { id: "home", label: "Home basics", detail: "Bands, dumbbells, or a small rack." },
  { id: "gym", label: "Full gym access", detail: "Machines, barbells, the works." },
];

const DIET_OPTIONS = [
  { id: "omnivore", label: "Omnivore" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescatarian", label: "Pescatarian" },
];

const COOKTIME_OPTIONS = [
  { id: "low", label: "Barely any", detail: "Meals need to be fast, most days." },
  { id: "mid", label: "Some", detail: "Can cook most nights, not elaborate." },
  { id: "high", label: "Plenty", detail: "Happy to cook, meal-prep on weekends." },
];

async function generateBespokePlan(inputs) {
  const prompt = `You are a training and nutrition coach building a personalized plan. You are NOT a doctor and must not reference or ask about medical history, diagnoses, or medications — work only from the goals and lifestyle preferences given below. Keep guidance general and non-extreme: no specific calorie or macro numbers, no aggressive deficits, plate-method and portion-by-hand style guidance only. If anything here suggests a medical concern, note that they should raise it with their own doctor rather than advising on it yourself.

Person's inputs:
- Primary goal: ${inputs.goalText}
- Experience level: ${inputs.experience}
- Equipment access: ${inputs.equipment}
- Training time available: ${inputs.time}
- Weekly schedule shape: ${inputs.schedule}
- Diet pattern: ${inputs.diet}
- Foods they avoid or dislike: ${inputs.avoidFoods || "none specified"}
- Time available for cooking: ${inputs.cookTime}
- Food budget: ${inputs.budget}
- Anything else motivating them: ${inputs.motivation || "none specified"}

Return ONLY valid JSON, no markdown fences, no preamble, in this exact shape:
{
  "headline": "one short encouraging line specific to their goal",
  "training": { "structure": "...", "weekly_shape": "...", "key_focus": "..." },
  "nutrition": { "framework": "...", "shopping_and_prep": "...", "key_focus": "..." },
  "one_habit_to_start": "the single highest-leverage habit for them to start this week"
}`;

  const response = await fetch("/.netlify/functions/generate-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error("Request failed");
  const data = await response.json();
  const text = data.content.map((b) => b.text || "").join("").trim();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}



// Wordmark icon — mirrors the brand mark: an ascending chain that breaks into a spark.
function LogoIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill={TOKENS.cream} stroke={TOKENS.ink} strokeWidth="3.5" />
      <path
        d="M 26 70 L 40 59 L 55 47 L 74 29"
        fill="none"
        stroke={TOKENS.evergreen}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="26" cy="70" r="4" fill={TOKENS.evergreen} />
      <circle cx="40" cy="59" r="5" fill={TOKENS.evergreen} />
      <circle cx="55" cy="47" r="5.5" fill={TOKENS.evergreen} />
      <circle cx="74" cy="29" r="8.5" fill={TOKENS.amber} stroke={TOKENS.ink} strokeWidth="2" />
      <g stroke={TOKENS.amber} strokeWidth="2.5" strokeLinecap="round">
        <line x1="74" y1="14" x2="74" y2="9" />
        <line x1="86" y1="20" x2="90" y2="17" />
        <line x1="89" y1="32" x2="94" y2="32" />
      </g>
    </svg>
  );
}

function TierCard({ tier, open, onToggle }) {
  const Icon = tier.icon;
  return (
    <div
      className="relative rounded-sm border overflow-hidden transition-all duration-200 hover:shadow-md"
      style={{ borderColor: open ? tier.color : TOKENS.line, background: TOKENS.cream }}
    >
      <div
        className="absolute top-0 right-0 px-3 py-1.5 text-[11px] tracking-wide font-medium"
        style={{
          background: tier.color,
          color: TOKENS.cream,
          fontFamily: "'IBM Plex Mono', monospace",
          borderBottomLeftRadius: "3px",
        }}
      >
        {tier.label}
      </div>
      <button
        onClick={onToggle}
        className="w-full text-left p-5 sm:p-6 flex items-start gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ "--tw-ring-color": tier.color }}
      >
        <Icon size={22} style={{ color: tier.color, marginTop: 3, flexShrink: 0 }} />
        <div className="flex-1 pr-16">
          <h3
            className="text-lg sm:text-xl mb-1.5"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: TOKENS.ink }}
          >
            {tier.name}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: `${TOKENS.ink}CC`, fontFamily: "'IBM Plex Sans', sans-serif" }}>
            {tier.summary}
          </p>
        </div>
        <ChevronDown
          size={18}
          className="transition-transform mt-1 flex-shrink-0"
          style={{ color: TOKENS.ink, transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="px-5 sm:px-6 pb-6 -mt-1" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
          <div className="h-px w-full mb-4" style={{ background: TOKENS.line }} />
          <ul className="space-y-3 mb-4">
            {tier.examples.map((ex, i) => (
              <li key={i} className="text-sm leading-relaxed">
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 500, color: tier.color }}>
                  {ex.name}
                </span>
                <span style={{ color: `${TOKENS.ink}B0` }}> — {ex.note}</span>
              </li>
            ))}
          </ul>
          <div
            className="text-sm leading-relaxed p-3.5 rounded-sm"
            style={{ background: `${tier.color}14`, color: TOKENS.ink, fontStyle: "italic" }}
          >
            {tier.takeaway}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectGrid({ options, value, onChange, columns = 3 }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-${columns} gap-2.5`}>
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="text-left p-3.5 rounded-sm border transition-all focus:outline-none"
            style={{
              borderColor: active ? TOKENS.evergreen : TOKENS.line,
              background: active ? `${TOKENS.evergreen}12` : TOKENS.cream,
              fontFamily: "'IBM Plex Sans', sans-serif",
            }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              {active ? (
                <CheckCircle2 size={15} style={{ color: TOKENS.evergreen, flexShrink: 0 }} />
              ) : (
                <Circle size={15} style={{ color: `${TOKENS.ink}55`, flexShrink: 0 }} />
              )}
              <span className="text-sm font-medium" style={{ color: TOKENS.ink }}>
                {opt.label}
              </span>
            </div>
            {opt.detail && (
              <p className="text-xs leading-snug pl-6" style={{ color: `${TOKENS.ink}90` }}>
                {opt.detail}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}

function PlanSection({ icon: Icon, title, children, delay = 0 }) {
  return (
    <div
      className="p-5 sm:p-6 rounded-sm border"
      style={{ borderColor: TOKENS.line, background: TOKENS.cream, animation: `pg-rise 0.5s ease ${delay}s backwards` }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-1.5 rounded-sm" style={{ background: `${TOKENS.evergreen}15` }}>
          <Icon size={17} style={{ color: TOKENS.evergreen }} />
        </div>
        <h3 className="text-base sm:text-lg" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: TOKENS.ink }}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

export default function BuildYourOwnHero() {
  const fontsLoaded = useFonts();
  const [tab, setTab] = useState("build");
  const [openTier, setOpenTier] = useState(1);

  const [time, setTime] = useState(null);
  const [budget, setBudget] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [goal, setGoal] = useState(null);
  const [showPlan, setShowPlan] = useState(false);

  const [mode, setMode] = useState("quick"); // "quick" | "bespoke"
  const [isPremium, setIsPremium] = useState(false);
  const [experience, setExperience] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [diet, setDiet] = useState(null);
  const [cookTime, setCookTime] = useState(null);
  const [avoidFoods, setAvoidFoods] = useState("");
  const [goalText, setGoalText] = useState("");
  const [motivation, setMotivation] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [apiPlan, setApiPlan] = useState(null);

  const canGenerateBespoke = time && budget && schedule && experience && equipment && diet && cookTime && goalText.trim();

  async function handleBespokeSubmit() {
    setApiLoading(true);
    setApiError(null);
    try {
      const plan = await generateBespokePlan({
        goalText,
        experience: EXPERIENCE_OPTIONS.find((o) => o.id === experience)?.label,
        equipment: EQUIPMENT_OPTIONS.find((o) => o.id === equipment)?.label,
        time: TIME_OPTIONS.find((o) => o.id === time)?.label,
        schedule: SCHEDULE_OPTIONS.find((o) => o.id === schedule)?.label,
        diet: DIET_OPTIONS.find((o) => o.id === diet)?.label,
        avoidFoods,
        cookTime: COOKTIME_OPTIONS.find((o) => o.id === cookTime)?.label,
        budget: BUDGET_OPTIONS.find((o) => o.id === budget)?.label,
        motivation,
      });
      setApiPlan(plan);
    } catch (e) {
      setApiError("Couldn't generate a plan just now — try again in a moment.");
    } finally {
      setApiLoading(false);
    }
  }

  const canGenerate = time && budget && schedule && goal;

  const training = useMemo(() => (canGenerate ? buildTraining(time, schedule, goal) : null), [time, schedule, goal, canGenerate]);
  const nutrition = useMemo(() => (canGenerate ? buildNutrition(budget, schedule, goal) : null), [budget, schedule, goal, canGenerate]);

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: TOKENS.paper,
        opacity: fontsLoaded ? 1 : 0,
        transition: "opacity 0.25s ease",
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <style>{`
        @keyframes pg-draw { to { stroke-dashoffset: 0; } }
        @keyframes pg-pop { to { opacity: 1; } }
        @keyframes pg-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
      `}</style>

      {/* Hero */}
      <header
        className="relative border-b overflow-hidden"
        style={{
          borderColor: TOKENS.line,
          background: `radial-gradient(ellipse 900px 500px at 82% -10%, ${TOKENS.evergreen}22, transparent 60%), ${TOKENS.paper}`,
        }}
      >
        {/* faint dot-grid texture, evokes lab notebook graph paper */}
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${TOKENS.line} 1px, transparent 1px)`,
            backgroundSize: "22px 22px",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 85%)",
          }}
        />

        <div className="relative max-w-3xl mx-auto px-5 sm:px-8 pt-14 pb-9">
          <div className="flex items-center gap-2.5 mb-4">
            <LogoIcon size={30} />
            <span
              className="text-xs tracking-[0.2em] uppercase"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.evergreen, fontWeight: 500 }}
            >
              Build Your Own Hero
            </span>
          </div>

          <div
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase mb-6 px-2.5 py-1 rounded-sm border"
            style={{ fontFamily: "'IBM Plex Mono', monospace", background: TOKENS.cream, borderColor: TOKENS.line, color: TOKENS.evergreenDeep }}
          >
            <FlaskConical size={13} />
            For adults 18–50 · not medical advice
          </div>

          <h1
            className="text-4xl sm:text-5xl leading-[1.05] mb-4 max-w-2xl"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: TOKENS.ink, animation: "pg-rise 0.6s ease" }}
          >
            Skip the injection.
            <br />
            <span style={{ color: TOKENS.evergreen }}>Build the plan</span> that actually moves the needle.
          </h1>
          <p
            className="text-base leading-relaxed max-w-xl mb-8"
            style={{ color: `${TOKENS.ink}B5`, animation: "pg-rise 0.6s ease 0.1s backwards" }}
          >
            Everyone's asking about peptides. Most of what's trending online skips the part where
            you find out what's actually been tested. Start with a training and nutrition plan
            built around your real life — then read the honest, tier-by-tier story on what the
            evidence for peptides actually says.
          </p>

          <div className="max-w-2xl mb-1" style={{ height: 46, animation: "pg-rise 0.6s ease 0.2s backwards" }}>
            <ChainMotif className="w-full h-full" />
          </div>
        </div>

        {/* Tabs */}
        <div className="relative max-w-3xl mx-auto px-5 sm:px-8">
          <div className="flex gap-1 -mb-px">
            {[
              { id: "build", label: "Build my plan", icon: Target },
              { id: "learn", label: "Learn the evidence", icon: Activity },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all"
                  style={{
                    borderColor: active ? TOKENS.evergreen : "transparent",
                    color: active ? TOKENS.evergreenDeep : `${TOKENS.ink}70`,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                  }}
                >
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        {tab === "learn" && (
          <div>
            <div className="space-y-3 mb-10">
              {TIERS.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  open={openTier === tier.id}
                  onToggle={() => setOpenTier(openTier === tier.id ? null : tier.id)}
                />
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="p-5 rounded-sm border" style={{ borderColor: TOKENS.line, background: TOKENS.cream }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={17} style={{ color: TOKENS.brick }} />
                  <h4 className="text-sm font-semibold tracking-wide uppercase" style={{ color: TOKENS.ink, fontFamily: "'IBM Plex Mono', monospace" }}>
                    Red flags
                  </h4>
                </div>
                <ul className="space-y-2.5">
                  {REDFLAGS.map((f, i) => (
                    <li key={i} className="text-sm leading-relaxed flex gap-2" style={{ color: `${TOKENS.ink}CC` }}>
                      <span style={{ color: TOKENS.brick }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 rounded-sm border" style={{ borderColor: TOKENS.line, background: TOKENS.cream }}>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck size={17} style={{ color: TOKENS.evergreen }} />
                  <h4 className="text-sm font-semibold tracking-wide uppercase" style={{ color: TOKENS.ink, fontFamily: "'IBM Plex Mono', monospace" }}>
                    Questions worth asking
                  </h4>
                </div>
                <ul className="space-y-2.5">
                  {GOOD_QUESTIONS.map((f, i) => (
                    <li key={i} className="text-sm leading-relaxed flex gap-2" style={{ color: `${TOKENS.ink}CC` }}>
                      <span style={{ color: TOKENS.evergreen }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {tab === "build" && (
          <div>
            {!showPlan && !apiPlan ? (
              <div className="space-y-8">
                <div
                  className="flex items-center gap-1 p-1 rounded-sm border w-fit"
                  style={{ borderColor: TOKENS.line, background: TOKENS.cream }}
                >
                  {[
                    { id: "quick", label: "Quick plan" },
                    { id: "bespoke", label: "Bespoke plan · Premium" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className="px-3.5 py-2 text-xs font-medium rounded-sm transition-all"
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        background: mode === m.id ? TOKENS.evergreen : "transparent",
                        color: mode === m.id ? TOKENS.cream : `${TOKENS.ink}90`,
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {mode === "bespoke" && !isPremium ? (
                  <div
                    className="p-6 rounded-sm border text-center"
                    style={{ borderColor: TOKENS.line, background: `${TOKENS.evergreen}0A` }}
                  >
                    <p className="text-sm mb-4" style={{ color: `${TOKENS.ink}CC` }}>
                      Bespoke plans use a deeper, goals-and-lifestyle intake — no medical history —
                      to generate a plan written specifically for you. This is where a real
                      subscription gate would sit.
                    </p>
                    <button
                      onClick={() => setIsPremium(true)}
                      className="px-5 py-2.5 rounded-sm text-sm font-semibold"
                      style={{ background: TOKENS.evergreen, color: TOKENS.cream }}
                    >
                      Simulate premium unlock (demo only)
                    </button>
                  </div>
                ) : mode === "bespoke" ? (
                  <div className="space-y-8">
                    <div>
                      <label className="text-sm font-semibold block mb-2" style={{ color: TOKENS.ink }}>
                        What's the actual goal? Be specific.
                      </label>
                      <input
                        value={goalText}
                        onChange={(e) => setGoalText(e.target.value)}
                        placeholder="e.g. run a 5k without stopping, fit into old clothes by summer, feel less wrecked by 3pm"
                        className="w-full p-3 rounded-sm border text-sm outline-none"
                        style={{ borderColor: TOKENS.line, background: TOKENS.cream, color: TOKENS.ink }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Activity size={16} style={{ color: TOKENS.evergreen }} />
                        <label className="text-sm font-semibold" style={{ color: TOKENS.ink }}>Training experience</label>
                      </div>
                      <SelectGrid options={EXPERIENCE_OPTIONS} value={experience} onChange={setExperience} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Dumbbell size={16} style={{ color: TOKENS.evergreen }} />
                        <label className="text-sm font-semibold" style={{ color: TOKENS.ink }}>Equipment access</label>
                      </div>
                      <SelectGrid options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} style={{ color: TOKENS.evergreen }} />
                        <label className="text-sm font-semibold" style={{ color: TOKENS.ink }}>Training time available</label>
                      </div>
                      <SelectGrid options={TIME_OPTIONS} value={time} onChange={setTime} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CalendarDays size={16} style={{ color: TOKENS.evergreen }} />
                        <label className="text-sm font-semibold" style={{ color: TOKENS.ink }}>Weekly schedule shape</label>
                      </div>
                      <SelectGrid options={SCHEDULE_OPTIONS} value={schedule} onChange={setSchedule} columns={2} />
                    </div>

                    <div>
                      <label className="text-sm font-semibold block mb-3" style={{ color: TOKENS.ink }}>Diet pattern</label>
                      <SelectGrid options={DIET_OPTIONS} value={diet} onChange={setDiet} columns={4} />
                    </div>

                    <div>
                      <label className="text-sm font-semibold block mb-2" style={{ color: TOKENS.ink }}>
                        Foods you avoid or just don't like <span style={{ fontWeight: 400, color: `${TOKENS.ink}80` }}>(optional)</span>
                      </label>
                      <input
                        value={avoidFoods}
                        onChange={(e) => setAvoidFoods(e.target.value)}
                        placeholder="e.g. shellfish, cilantro, dairy"
                        className="w-full p-3 rounded-sm border text-sm outline-none"
                        style={{ borderColor: TOKENS.line, background: TOKENS.cream, color: TOKENS.ink }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <UtensilsCrossed size={16} style={{ color: TOKENS.evergreen }} />
                        <label className="text-sm font-semibold" style={{ color: TOKENS.ink }}>Time available for cooking</label>
                      </div>
                      <SelectGrid options={COOKTIME_OPTIONS} value={cookTime} onChange={setCookTime} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Wallet size={16} style={{ color: TOKENS.evergreen }} />
                        <label className="text-sm font-semibold" style={{ color: TOKENS.ink }}>Food budget</label>
                      </div>
                      <SelectGrid options={BUDGET_OPTIONS} value={budget} onChange={setBudget} />
                    </div>

                    <div>
                      <label className="text-sm font-semibold block mb-2" style={{ color: TOKENS.ink }}>
                        Anything else worth knowing? <span style={{ fontWeight: 400, color: `${TOKENS.ink}80` }}>(optional, no medical history)</span>
                      </label>
                      <input
                        value={motivation}
                        onChange={(e) => setMotivation(e.target.value)}
                        placeholder="e.g. training for a hiking trip in October, want to keep up with my kids"
                        className="w-full p-3 rounded-sm border text-sm outline-none"
                        style={{ borderColor: TOKENS.line, background: TOKENS.cream, color: TOKENS.ink }}
                      />
                    </div>

                    {apiError && (
                      <p className="text-sm" style={{ color: TOKENS.brick }}>{apiError}</p>
                    )}

                    <button
                      disabled={!canGenerateBespoke || apiLoading}
                      onClick={handleBespokeSubmit}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                      style={{
                        background: canGenerateBespoke && !apiLoading ? TOKENS.evergreen : `${TOKENS.ink}25`,
                        color: TOKENS.cream,
                        cursor: canGenerateBespoke && !apiLoading ? "pointer" : "not-allowed",
                        boxShadow: canGenerateBespoke ? `0 4px 14px ${TOKENS.evergreen}40` : "none",
                      }}
                    >
                      {apiLoading ? "Writing your plan…" : "Generate my bespoke plan"}
                      {!apiLoading && <ArrowRight size={16} />}
                    </button>
                  </div>
                ) : (
                  <>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} style={{ color: TOKENS.evergreen }} />
                    <label className="text-sm font-semibold" style={{ color: TOKENS.ink }}>
                      How much training time do you realistically have?
                    </label>
                  </div>
                  <SelectGrid options={TIME_OPTIONS} value={time} onChange={setTime} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Wallet size={16} style={{ color: TOKENS.evergreen }} />
                    <label className="text-sm font-semibold" style={{ color: TOKENS.ink }}>
                      What's your food budget like?
                    </label>
                  </div>
                  <SelectGrid options={BUDGET_OPTIONS} value={budget} onChange={setBudget} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays size={16} style={{ color: TOKENS.evergreen }} />
                    <label className="text-sm font-semibold" style={{ color: TOKENS.ink }}>
                      What does your week look like?
                    </label>
                  </div>
                  <SelectGrid options={SCHEDULE_OPTIONS} value={schedule} onChange={setSchedule} columns={2} />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={16} style={{ color: TOKENS.evergreen }} />
                    <label className="text-sm font-semibold" style={{ color: TOKENS.ink }}>
                      What are you actually trying to do?
                    </label>
                  </div>
                  <SelectGrid options={GOAL_OPTIONS} value={goal} onChange={setGoal} columns={2} />
                </div>

                <button
                  disabled={!canGenerate}
                  onClick={() => setShowPlan(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: canGenerate ? TOKENS.evergreen : `${TOKENS.ink}25`,
                    color: TOKENS.cream,
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    cursor: canGenerate ? "pointer" : "not-allowed",
                    boxShadow: canGenerate ? `0 4px 14px ${TOKENS.evergreen}40` : "none",
                  }}
                >
                  Build my plan
                  <ArrowRight size={16} />
                </button>
                  </>
                )}
              </div>
            ) : apiPlan ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span
                      className="text-xs tracking-widest uppercase"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.evergreen }}
                    >
                      Bespoke plan
                    </span>
                    <h2 className="text-xl sm:text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: TOKENS.ink }}>
                      {apiPlan.headline}
                    </h2>
                  </div>
                  <button
                    onClick={() => setApiPlan(null)}
                    className="text-xs font-medium underline flex-shrink-0"
                    style={{ color: TOKENS.evergreenDeep, fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    edit inputs
                  </button>
                </div>

                <PlanSection icon={Dumbbell} title="Training" delay={0}>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: TOKENS.ink }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.evergreenDeep }}>Structure — </span>
                    {apiPlan.training.structure}
                  </p>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: `${TOKENS.ink}CC` }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.evergreenDeep }}>Weekly shape — </span>
                    {apiPlan.training.weekly_shape}
                  </p>
                  <div className="h-px w-full my-3" style={{ background: TOKENS.line }} />
                  <p className="text-sm leading-relaxed" style={{ color: `${TOKENS.ink}CC` }}>
                    <strong style={{ color: TOKENS.ink }}>Key focus: </strong>
                    {apiPlan.training.key_focus}
                  </p>
                </PlanSection>

                <PlanSection icon={UtensilsCrossed} title="Nutrition" delay={0.1}>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: TOKENS.ink }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.evergreenDeep }}>Framework — </span>
                    {apiPlan.nutrition.framework}
                  </p>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: `${TOKENS.ink}CC` }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.evergreenDeep }}>Shopping & prep — </span>
                    {apiPlan.nutrition.shopping_and_prep}
                  </p>
                  <div className="h-px w-full my-3" style={{ background: TOKENS.line }} />
                  <p className="text-sm leading-relaxed" style={{ color: `${TOKENS.ink}CC` }}>
                    <strong style={{ color: TOKENS.ink }}>Key focus: </strong>
                    {apiPlan.nutrition.key_focus}
                  </p>
                </PlanSection>

                <div
                  className="p-5 rounded-sm border"
                  style={{ borderColor: TOKENS.evergreen, background: `${TOKENS.evergreen}0F`, animation: "pg-rise 0.5s ease 0.2s backwards" }}
                >
                  <span className="text-xs tracking-widest uppercase block mb-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.evergreenDeep }}>
                    Start here
                  </span>
                  <p className="text-sm leading-relaxed" style={{ color: TOKENS.ink }}>{apiPlan.one_habit_to_start}</p>
                </div>

                <p className="text-xs leading-relaxed pt-2" style={{ color: `${TOKENS.ink}80`, fontFamily: "'IBM Plex Mono', monospace" }}>
                  Generated from goals and lifestyle only, not medical history — adjust to your own
                  results, and check with a doctor before changing diet or training if you have an
                  existing condition.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl sm:text-2xl" style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, color: TOKENS.ink }}>
                    Your plan
                  </h2>
                  <button
                    onClick={() => setShowPlan(false)}
                    className="text-xs font-medium underline"
                    style={{ color: TOKENS.evergreenDeep, fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    edit inputs
                  </button>
                </div>

                <PlanSection icon={Dumbbell} title="Training" delay={0}>
                  <p className="text-sm mb-3" style={{ color: TOKENS.ink }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.evergreenDeep }}>Structure — </span>
                    {training.structure}
                  </p>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: `${TOKENS.ink}CC` }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.evergreenDeep }}>Each session — </span>
                    {training.session}
                  </p>
                  <div className="h-px w-full my-3" style={{ background: TOKENS.line }} />
                  <p className="text-sm leading-relaxed mb-2" style={{ color: `${TOKENS.ink}CC` }}>
                    <strong style={{ color: TOKENS.ink }}>For your schedule: </strong>
                    {training.scheduleNote}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: `${TOKENS.ink}CC` }}>
                    <strong style={{ color: TOKENS.ink }}>For your goal: </strong>
                    {training.goalNote}
                  </p>
                </PlanSection>

                <PlanSection icon={UtensilsCrossed} title="Nutrition" delay={0.1}>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: TOKENS.ink }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.evergreenDeep }}>Framework — </span>
                    {nutrition.framework}
                  </p>
                  <p className="text-sm mb-3 leading-relaxed" style={{ color: `${TOKENS.ink}CC` }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: TOKENS.evergreenDeep }}>Shopping — </span>
                    {nutrition.shopping}
                  </p>
                  <div className="h-px w-full my-3" style={{ background: TOKENS.line }} />
                  <p className="text-sm leading-relaxed mb-2" style={{ color: `${TOKENS.ink}CC` }}>
                    <strong style={{ color: TOKENS.ink }}>For your schedule: </strong>
                    {nutrition.scheduleNote}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: `${TOKENS.ink}CC` }}>
                    <strong style={{ color: TOKENS.ink }}>For your goal: </strong>
                    {nutrition.goalNote}
                  </p>
                </PlanSection>

                <p className="text-xs leading-relaxed pt-2" style={{ color: `${TOKENS.ink}80`, fontFamily: "'IBM Plex Mono', monospace" }}>
                  General framework, not a prescription — adjust portions to your own hunger and results, and check with a doctor before changing diet or training if you have an existing condition.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="border-t" style={{ borderColor: TOKENS.line }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 py-6">
          <p className="text-xs leading-relaxed" style={{ color: `${TOKENS.ink}80`, fontFamily: "'IBM Plex Mono', monospace" }}>
            Educational information only — not a substitute for a conversation with your own doctor,
            especially before starting any peptide, supplement, or new training program.
          </p>
        </div>
      </footer>
    </div>
  );
}
