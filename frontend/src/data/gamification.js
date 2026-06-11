// ── Level system ──────────────────────────────────────────────────────────────

export const TIER_TITLES = [
  'Novice',      // 1–10
  'Apprentice',  // 11–20
  'Scholar',     // 21–30
  'Analyst',     // 31–40
  'Expert',      // 41–50
  'Strategist',  // 51–60
  'Sage',        // 61–70
  'Mentor',      // 71–80
  'Champion',    // 81–90
  'Luminary',    // 91–100
];

const SENIORITY = { 3: 'Junior', 6: 'Senior', 9: 'Elite' };

export function getLevelTitle(level) {
  const l = Math.max(1, Math.min(100, level));
  const tierIdx = Math.floor((l - 1) / 10);
  const pos = ((l - 1) % 10) + 1;
  const base = TIER_TITLES[tierIdx];
  const prefix = SENIORITY[pos];
  return prefix ? `${prefix} ${base}` : base;
}

// XP required to advance from `level` to `level + 1` (linear scale +50 per level)
export function xpForLevel(level) {
  if (level >= 100) return Infinity;
  return 100 + (level - 1) * 50;
}

// ── Achievements ──────────────────────────────────────────────────────────────

export const ACHIEVEMENTS = [
  {
    id:    'create_reviewer',
    label: 'First Reviewer',
    desc:  'Create your first AI-generated reviewer',
    icon:  '📚',
    xp:    10,
  },
  {
    id:    'talk_reviewbot',
    label: 'First Chat',
    desc:  'Send your first message to ReviewBot',
    icon:  '💬',
    xp:    5,
  },
  {
    id:    'finish_review',
    label: 'Session Complete',
    desc:  'Finish a complete review session from start to end',
    icon:  '✅',
    xp:    10,
  },
  {
    id:    'review_all_terms',
    label: 'Full Coverage',
    desc:  'Review every term in a folder (at least 20 terms)',
    icon:  '🗂️',
    xp:    15,
  },
  {
    id:    'reach_95_mastery',
    label: 'Almost Perfect',
    desc:  'Reach 95% mastery on a folder with at least 20 terms',
    icon:  '⭐',
    xp:    20,
  },
  {
    id:    'ace_first_test',
    label: 'Ace!',
    desc:  'Achieve 100% mastery in a session with at least 20 terms',
    icon:  '🎯',
    xp:    30,
  },
  {
    id:    'create_5_reviewers',
    label: 'Prolific',
    desc:  'Create 5 AI reviewers',
    icon:  '📖',
    xp:    15,
  },
  {
    id:    'create_10_reviewers',
    label: 'Scholar',
    desc:  'Create 10 AI reviewers',
    icon:  '🎓',
    xp:    25,
  },
  {
    id:    'review_10_times',
    label: 'Dedicated',
    desc:  'Complete 10 review sessions',
    icon:  '🔥',
    xp:    15,
  },
  {
    id:    'review_20_times',
    label: 'Committed',
    desc:  'Complete 20 review sessions',
    icon:  '💪',
    xp:    25,
  },
  {
    id:    'verify_email',
    label: 'Verified',
    desc:  'Verify your email to enable public sharing',
    icon:  '✉️',
    xp:    10,
  },
  {
    id:    'make_public',
    label: 'Sharing is Caring',
    desc:  'Publish a reviewer for others to use',
    icon:  '🌐',
    xp:    15,
  },
  {
    id:    'use_public_reviewer',
    label: 'Community Student',
    desc:  'Open and study a public reviewer',
    icon:  '🤝',
    xp:    10,
  },
  {
    id:    'download_reviewer',
    label: 'Downloaded',
    desc:  'Download a public reviewer to your device',
    icon:  '💾',
    xp:    10,
  },
  {
    id:    'follow_creator',
    label: 'Fan',
    desc:  'Follow a reviewer creator',
    icon:  '❤️',
    xp:    5,
  },
  {
    id:    'get_10_views',
    label: 'Popular',
    desc:  'Receive 10 views on one of your reviewers',
    icon:  '👀',
    xp:    20,
  },
  {
    id:    'get_10_likes',
    label: 'Beloved',
    desc:  'Receive 10 likes or downloads on a reviewer',
    icon:  '💎',
    xp:    25,
  },
  {
    id:    'reach_level_10',
    label: 'Rising',
    desc:  'Reach level 10',
    icon:  '🚀',
    xp:    30,
  },
  {
    id:    'stock_knowledge',
    label: 'Stock Knowledge',
    desc:  'Achieve 50%+ mastery on your very first attempt (20+ terms)',
    icon:  '🧠',
    xp:    40,
  },
  {
    id:    'im_him',
    label: "I'm Him",
    desc:  'Achieve 100% mastery on your very first attempt (20+ terms)',
    icon:  '👑',
    xp:    50,
  },
];
