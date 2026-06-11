// src/data/mockData.js

// ─── Palette & design tokens ──────────────────────────────────────────────────
export const PALETTE = {
  indigo:   "#8C98E4",
  lav:      "#C3BEE9",
  blush:    "#F9E4EB",
  pink:     "#F5CAE8",
};

// ─── User ─────────────────────────────────────────────────────────────────────
export const USER = {
  firstName: "Tung Tung Tung",
  lastName:  "Surname",
  email:     "TripleT@email.com",
  username:  "@TripleT",
  avatar:    "T",
  level:     12,
  xp:        310,   // xpForLevel(12) = 650 — 310 ≈ 48% through this level
  xpMax:     650,
  streak:    7,
  accuracy:  81,
  totalXp:   3240,
};

// ─── Folders ──────────────────────────────────────────────────────────────────
export const FOLDERS = [
  { id: 1, name: "Subject 1 Notes",    files: 5, pub: false, edited: "2h ago"    },
  { id: 2, name: "Subject 2 Review",   files: 3, pub: true,  edited: "yesterday" },
];

// ─── Sidebar file tree ────────────────────────────────────────────────────────
export const SIDEBAR_FILES = [
  { id: 1, name: "Subject 1 Notes",       count: 5, t: "folder" },
  { id: 2, name: "Subject 2 Review",      count: 3, t: "folder" },
  { id: 3, name: "Lecture_07.pdf",                  t: "file"   },
  { id: 4, name: "Chapter4_Slides.pptx",            t: "file"   },
  { id: 5, name: "Topic_Summary.txt",               t: "file"   },
];

// ─── Recently viewed ──────────────────────────────────────────────────────────
export const RECENTS = [
  { id: 1, name: "Topic 1 Flashcards",  time: "2 hours ago", type: "Flashcard", col: 1 },
  { id: 2, name: "Subject 2 MCQ Set 2", time: "Yesterday",   type: "MCQ",       col: 2 },
  { id: 3, name: "Topic 3 Summary",     time: "3 days ago",  type: "Summary",   col: 3 },
];

// ─── Progress stats ───────────────────────────────────────────────────────────
export const STATS = [
  { label: "Level",     val: "12",      sub: "Top 18% of users"  },
  { label: "Total XP",  val: "3,240",   sub: "+320 this week"     },
  { label: "Streak",    val: "7 days",  sub: "Best: 14 days"      },
  { label: "Accuracy",  val: "81%",     sub: "+4% vs last week"   },
];

export const ACTIVITY = [0,0,1,2,1,0,3,2,1,0,2,3,2,0,1,2,0,3,2,1,0,3,3,2,1,3,3,2];

export const ACC_TYPES = [
  { label: "Flashcards",   pct: 88, icon: "flashcard" },
  { label: "MCQ",          pct: 74, icon: "mcq"       },
  { label: "Fill-in-blank",pct: 61, icon: "fib"       },
];

export const BADGES = [
  { n: "First Quiz",   e: "🏅", ok: true  },
  { n: "7-Day Streak", e: "🔥", ok: true  },
  { n: "Level 20",     e: "⭐", ok: true  },
  { n: "Top Scorer",   e: "💎", ok: true  },
  { n: "Night Owl",    e: "🦉", ok: false },
  { n: "Speed Run",    e: "⚡", ok: false },
];

// ─── Upload modal ─────────────────────────────────────────────────────────────
export const UPLOAD_FILES = [
  { id: 1, name: "Lecture_07_Subject1.pdf",  size: "2.4 MB", type: "PDF", uploading: true,  pct: 55 },
  { id: 2, name: "Chapter4_Slides.pptx",     size: "4.1 MB", type: "PPT", uploading: false          },
];

// ─── Generate modal ───────────────────────────────────────────────────────────
export const OUTPUT_TYPES = [
  { key: "Flashcards",   icon: "flashcard", desc: "Key terms with context-aware definitions"    },
  { key: "MCQ",          icon: "mcq",       desc: "Multiple choice questions from content"      },
  { key: "Fill-in-blank",icon: "fib",       desc: "Critical keywords removed from sentences"    },
  { key: "Summary PDF",  icon: "summary",   desc: "Abstractive summary with bullet points"      },
];

// ─── Dynamic Content (Backend Data Arrays) ────────────────────────────────────
export const FLASHCARDS = [
  { id: 1, term: "Term One",   sub: "Category · Subject 1", def: "Definition of term one: a detailed explanation grounded in your uploaded study material, providing full context for review." },
  { id: 2, term: "Term Two",   sub: "Category · Subject 2", def: "Definition of term two: context-aware explanation extracted from lecture notes and cross-referenced with slide content."     },
  { id: 3, term: "Term Three", sub: "Category · Subject 1", def: "Definition of term three: an important concept found across multiple slides, summarised for focused review."                  },
  { id: 4, term: "Term Four",  sub: "Category · Subject 2", def: "Definition of term four: derived from the uploaded PDF, capturing the core idea discussed in chapter three."                  },
];

export const MCQ_DATA = [
  {
    id: 1,
    q: "Which concept best describes the primary mechanism by which the key process in Subject 1 operates under standard conditions?",
    opts: ["Option A — the correct answer as extracted from the source document", "Option B — a plausible distractor", "Option C — another distractor", "Option D — a fourth distractor"],
    correct: 0,
  },
  {
    id: 2,
    q: "According to the study material, what is the main function of the key element discussed in Chapter 4?",
    opts: ["Option A — distractor one", "Option B — the correct answer from lecture notes", "Option C — distractor two", "Option D — distractor three"],
    correct: 1,
  },
  {
    id: 3,
    q: "Which best explains the relationship between Component A and Component B as outlined in the source document?",
    opts: ["Option A — distractor", "Option B — distractor", "Option C — correct answer supported by content", "Option D — distractor"],
    correct: 2,
  },
];

export const FIB_DATA = [
  { id: 1, before: "The ", blank: "mitochondria", after: " is a double-membrane organelle found in eukaryotic cells that generates most of the cell's supply of energy-carrying molecules.", hint: "Starts with 'M' and has two membranes." },
  { id: 2, before: "During ", blank: "mitosis", after: ", the cell synthesises new DNA and prepares its genetic material for division into two daughter cells.", hint: "A phase of the cell cycle." },
  { id: 3, before: "The ", blank: "Big Bang", after: " theory proposes that the universe began from an extremely hot, dense singularity approximately 13.8 billion years ago.", hint: "Two words — also a common colloquial phrase for a sudden start." },
];

export const SUMMARY_DATA = {
  title:    "Subject 1 — Summary PDF",
  overview: "This document covers the fundamental concepts of Topic A as presented in the uploaded study material. It outlines the core mechanisms, processes, and applications discussed across multiple lectures and chapters, providing a structured reference for review.",
  points: [
    "The primary process involves a two-stage mechanism that operates under specific conditions to produce the desired molecular output.",
    "Key elements include components A, B, and C, each playing distinct roles in the overall system architecture.",
    "Supporting reactions capture and convert the primary input into intermediate forms used in the secondary stage.",
    "Overall equation: Input A + Input B + Energy → Product X + By-product Y.",
  ],
  keywords: ["Topic A", "Component B", "Process C", "Term D", "Concept E", "Keyword F", "Element G"],
};

// ─── Q&A initial messages ─────────────────────────────────────────────────────
export const QA_INIT = [
  { role: "user", text: "What is the role of the key organelle discussed in Subject 1?" },
  { role: "ai",   text: "Based on your Subject 1 file, the key organelle is responsible for producing energy-carrying molecules via the primary metabolic pathway. It has a double-membrane structure and contains its own genetic material, suggesting an endosymbiotic evolutionary origin." },
  { role: "user", text: "How does the double-membrane structure help?" },
  { role: "ai",   text: "The double membrane creates two distinct compartments — the intermembrane space and the inner matrix — essential for maintaining the electrochemical gradient used in energy synthesis via the key enzymatic complex described in Chapter 4." },
];

// ─── Search results ───────────────────────────────────────────────────────────
export const SEARCH_RES = [
  { id: 1, title: "Subject 1 — Flashcard Set",          by: "@user_a · Category A · 24 cards",     type: "Flashcard", col: 1 },
  { id: 2, title: "Subject 2 MCQ Bank",                 by: "@user_b · Category B · 50 questions", type: "MCQ",       col: 2 },
  { id: 3, title: "Topic C Summary Notes",              by: "@user_c · Category C · 8 pages",      type: "Summary",   col: 3 },
  { id: 4, title: "Topic D Fill-in-the-blanks Pack",    by: "@user_d · Category D · 30 questions", type: "FIB",       col: 1 },
];

// ─── Shared style helpers ─────────────────────────────────────────────────────
export const THUMB = {
  1: "linear-gradient(135deg,#eaecff,#c3bee9)",
  2: "linear-gradient(135deg,#fce4f1,#f5cae8)",
  3: "linear-gradient(135deg,#d1fae5,#a7f3d0)",
};

export const TYPE_ICON = {
  Flashcard: "flashcard",
  MCQ:       "mcq",
  Summary:   "summary",
  FIB:       "fib",
};

export const TYPE_BADGE_COL = {
  Flashcard: { bg: "rgba(140,152,228,.14)", cl: "#6b77cc"  },
  MCQ:       { bg: "rgba(245,202,232,.5)",  cl: "#9d3a7a"  },
  Summary:   { bg: "#d1fae5",               cl: "#059669"  },
  FIB:       { bg: "#fef3c7",               cl: "#b45309"  },
};

// ─── Navigation definitions (used by Sidebar) ─────────────────────────────────
export const NAV_MAIN = [
  { id: "dashboard",  label: "Dashboard",   icon: "dashboard" },
  { id: "progress",   label: "Progress",    icon: "progress"  },
  { id: "studyfiles", label: "Study Files", icon: "files"     },
];

export const NAV_GENERAL = [
  { id: "search",   label: "Search",   icon: "search"   },
  { id: "settings", label: "Settings", icon: "settings" },
];

// ─── Global Layout Text ───────────────────────────────────────────────────────
export const SIDEBAR_META = {
  logoMark:  "67",
  logoName:  "LogoName",
  logoSub:   "short desc here",
  seeAll:    "See all files →",
  navMain:   "MAIN",
  navGeneral:"GENERAL",
  myFiles:   "MY FILES",
};

export const TOPBAR = {
  placeholder: "Search files, topics, users...",
  notifLabel:  "Notifications",
};

// ─── STATIC UI PLACEHOLDERS ───────────────────────────────────────────────────

export const QA_CHAT = {
  title:       "AI Assistant",
  subtitle:    "Answers grounded in your uploaded materials.",
  placeholder: "Ask anything about your files...",
  seedUser:    "What is the role of mitochondria?",
  seedAi:      "Based on your Biology Notes file, mitochondria are membrane-bound organelles responsible for producing ATP via cellular respiration.",
  seedAiBold:  "Biology Notes",
};

export const MCQ_UI = {
  title:    "Biology Chapter 4 — MCQ",
  timer:    "1:45",
  counter:  "Q 4 / 10",
  qLabel:   "QUESTION 4",
  qText:    "Which organelle is responsible for producing ATP through cellular respiration, earning it the nickname \"the powerhouse of the cell\"?",
  choices:  [
    { opt: "A", text: "Mitochondria"          },
    { opt: "B", text: "Golgi apparatus"       },
    { opt: "C", text: "Endoplasmic reticulum" },
    { opt: "D", text: "Lysosome"              },
  ],
  progress: "40%",
};

export const FIB_UI = {
  score:    "Score: 1/1",
  counter:  "2 / 8",
  progress: "25%",
  sentence: {
    before: "The ",
    blank:  "_________",
    after:  " is a double-membrane organelle found in eukaryotic cells that generates most of the cell's supply of ATP.",
  },
  hint:     "Need a hint? It starts with \"M\" and has two membranes.",
};

export const SUMMARY_UI = {
  title:    "Photosynthesis — Summary PDF",
  overview: "Photosynthesis is the biological process by which green plants, algae, and certain bacteria convert light energy into chemical energy stored as glucose. The process occurs primarily in the chloroplasts and involves two main stages.",
  points: [
    "The light-dependent reactions occur in the thylakoid membranes and capture solar energy to produce ATP and NADPH.",
    "The Calvin cycle uses the ATP and NADPH produced to fix carbon dioxide into glucose molecules.",
    "Chlorophyll a and b are the primary pigments responsible for absorbing light energy, primarily in the red and blue wavelengths.",
    "The overall equation: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂",
  ],
  keywords: ["Photosynthesis", "Chloroplast", "Calvin Cycle", "Chlorophyll", "ATP", "NADPH", "Glucose"],
};

export const FLASHCARDS_UI = {
  title: "Cell Structure Flashcards",
};

export const QA_OUTPUT_UI = {
  title:       "Q&A Chat",
  sub:         "Ask anything about your uploaded file — answers are grounded in your source document.",
  placeholder: "Ask a question about your file...",
  aiReply:     "This is a grounded response based on your uploaded study file. The answer draws on the relevant sections of your document to address your question.",
};