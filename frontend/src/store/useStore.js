import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { USER } from '../data/mockData';
import { foldersApi } from '../api/folders.js';
import { outputsApi } from '../api/outputs.js';
import { xpForLevel, ACHIEVEMENTS } from '../data/gamification.js';

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function buildOutputCards(flashcards, mcqs, pdfOutputs) {
  const cards = [];
  if (flashcards.length)
    cards.push({ id: 'fc', name: 'Flashcards', type: 'Flashcard', col: 1, created: relativeTime(flashcards[0].created_at) });
  if (mcqs.length)
    cards.push({ id: 'mcq', name: 'MCQ Set', type: 'MCQ', col: 2, created: relativeTime(mcqs[0].created_at) });
  for (const out of pdfOutputs) {
    const isSummary = out.output_type === 'summary_pdf';
    cards.push({
      id: out.id, name: isSummary ? 'Summary PDF' : 'Reviewer PDF',
      type: isSummary ? 'Summary' : 'Reviewer', col: isSummary ? 3 : 4,
      created: relativeTime(out.created_at),
      downloadUrl: `http://127.0.0.1:8765/outputs/${out.id}/download`,
    });
  }
  return cards;
}

// Apply XP gain with level-up logic and level-10 achievement check.
// Returns updated user, earnedAchievements, and achievementQueue.
function applyXpGain(user, earned, queue, amount) {
  let xp = user.xp + amount;
  let level = user.level;
  let newEarned = earned;
  let newQueue = queue;

  while (level < 100 && xp >= xpForLevel(level)) { xp -= xpForLevel(level); level++; }

  // level-10 achievement — checked here so any XP path can trigger it
  if (level >= 10 && !newEarned['reach_level_10']) {
    const ach = ACHIEVEMENTS.find(a => a.id === 'reach_level_10');
    if (ach) {
      newEarned = { ...newEarned, reach_level_10: true };
      newQueue = [...newQueue, ach];
      xp += ach.xp;
      while (level < 100 && xp >= xpForLevel(level)) { xp -= xpForLevel(level); level++; }
    }
  }

  return {
    user:                { ...user, xp, level, xpMax: xpForLevel(level) },
    earnedAchievements:  newEarned,
    achievementQueue:    newQueue,
  };
}

// ── Public selector helper ────────────────────────────────────────────────────

export function getFolderMasteryPct(state, folderId) {
  const fcTotal  = (state.flashcards[folderId] ?? []).length;
  const mcqTotal = (state.mcqs[folderId]        ?? []).length;
  const total    = fcTotal + mcqTotal;
  if (total === 0) return null;
  const fcMastered  = Object.keys(state.masteredCards[folderId] ?? {}).length;
  const mcqMastered = Object.keys(state.masteredMCQs[folderId]  ?? {}).length;
  return Math.round(((fcMastered + mcqMastered) / total) * 100);
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Theme ───────────────────────────────────────────────
      theme: 'light',
      setTheme: (t) => {
        document.documentElement.setAttribute('data-theme', t);
        set({ theme: t });
      },

      // ── User ────────────────────────────────────────────────
      user: { ...USER, xpMax: xpForLevel(USER.level) },

      // ── Mastery (persisted) ──────────────────────────────────
      // { [folderId]: { [cardId]: true } }  — set when "Know it" is clicked
      masteredCards: {},
      // { [folderId]: { [questionId]: true } }  — set on correct MCQ answer
      masteredMCQs:  {},
      // { [folderId]: { [cardId]: true } }  — any assessment click (all ratings)
      reviewedCards: {},
      // XP milestone keys: `${folderId}-95`, `${folderId}-100`
      // Only written when ONLINE to prevent offline XP spoofing
      masteredSets: {},
      totalTermsMastered: 0,

      // ── Achievements (persisted) ─────────────────────────────
      earnedAchievements: {},   // { [achievementId]: true }
      reviewerCount:      0,    // total reviewers generated (for prolific / scholar)
      reviewSessionCount: 0,    // total review sessions completed

      // ── Achievement queue (NOT persisted) ───────────────────
      // Array of achievement objects waiting to be shown in the toast
      achievementQueue: [],

      // ── Session state (NOT persisted) ───────────────────────
      // Folders that had 0 mastery when the current session started.
      // Used to detect "first-try" achievements (stock_knowledge / im_him).
      sessionFreshFolders: {},

      // ── Mastery mock data ────────────────────────────────────
      masteryData: [
        { id: 101, name: 'Flashcards', score: 0, total: 10, type: 'Flashcard' },
        { id: 102, name: 'MCQ Set',    score: 0, total: 10, type: 'MCQ' },
        { id: 103, name: 'Summary',    score: 0, total: 10, type: 'Summary' },
      ],

      // ── API-backed state ─────────────────────────────────────
      folders: [],
      foldersLoading: false,
      sourceFiles: {},
      files: {},
      flashcards: {},
      mcqs: {},
      activeFolderId: null,

      // ── Folders ──────────────────────────────────────────────
      fetchFolders: async () => {
        set({ foldersLoading: true });
        try {
          const rows = await foldersApi.list();
          set({
            folders: rows.map(r => ({
              id: r.id, name: r.name,
              files: r.file_count ?? 0, pub: r.privacy === 'public',
              edited: relativeTime(r.updated_at), outputCount: r.output_count ?? 0,
            })),
            foldersLoading: false,
          });
        } catch { set({ foldersLoading: false }); }
      },

      addFolder: async (name) => {
        const row = await foldersApi.create(name);
        const folder = { id: row.id, name: row.name, files: 0, pub: false, edited: 'just now', outputCount: 0 };
        set(s => ({ folders: [...s.folders, folder] }));
        return folder;
      },

      // patch can be a string (new name) or an object { name?, privacy? }
      renameFolder: async (id, patch) => {
        const body = typeof patch === 'string' ? { name: patch } : patch;
        await foldersApi.update(id, body);
        set(s => ({
          folders: s.folders.map(f => {
            if (f.id !== id) return f;
            return {
              ...f,
              ...(body.name    ? { name: body.name }           : {}),
              ...(body.privacy ? { pub: body.privacy === 'public' } : {}),
            };
          }),
        }));
      },

      deleteFolder: async (id) => {
        await foldersApi.remove(id);
        set(s => {
          const { [id]: _sf, ...restSf } = s.sourceFiles;
          const { [id]: _f,  ...restF  } = s.files;
          const { [id]: _fc, ...restFc } = s.flashcards;
          const { [id]: _mq, ...restMq } = s.mcqs;
          return {
            folders: s.folders.filter(f => f.id !== id),
            sourceFiles: restSf, files: restF, flashcards: restFc, mcqs: restMq,
          };
        });
      },

      // ── Source files ─────────────────────────────────────────
      fetchSourceFiles: async (folderId) => {
        const rows = await foldersApi.listFiles(folderId);
        set(s => ({ sourceFiles: { ...s.sourceFiles, [folderId]: rows } }));
        return rows;
      },

      uploadFile: async (folderId, file) => {
        const row = await foldersApi.uploadFile(folderId, file);
        set(s => ({
          sourceFiles: { ...s.sourceFiles, [folderId]: [...(s.sourceFiles[folderId] ?? []), row] },
          folders: s.folders.map(f => f.id === folderId ? { ...f, files: (f.files || 0) + 1 } : f),
        }));
        return row;
      },

      deleteSourceFile: async (folderId, fileId) => {
        await foldersApi.deleteFile(fileId);
        set(s => ({
          sourceFiles: { ...s.sourceFiles, [folderId]: (s.sourceFiles[folderId] ?? []).filter(f => f.id !== fileId) },
        }));
      },

      // ── AI Generation ────────────────────────────────────────
      triggerGenerate: async (folderId) => {
        await foldersApi.generate(folderId);
        set(s => ({
          sourceFiles: {
            ...s.sourceFiles,
            [folderId]: (s.sourceFiles[folderId] ?? []).map(f =>
              f.status === 'pending' ? { ...f, status: 'chunking' } : f
            ),
          },
        }));

        // Track reviewer count and unlock achievements (online-only)
        if (navigator.onLine) {
          set(s => {
            const newCount = s.reviewerCount + 1;
            let newEarned = { ...s.earnedAchievements };
            let newQueue  = [...s.achievementQueue];
            let xpGain = 0;

            const tryUnlock = (id) => {
              if (!newEarned[id]) {
                const ach = ACHIEVEMENTS.find(a => a.id === id);
                if (ach) { newEarned[id] = true; newQueue.push(ach); xpGain += ach.xp; }
              }
            };

            if (newCount === 1)  tryUnlock('create_reviewer');
            if (newCount >= 5)   tryUnlock('create_5_reviewers');
            if (newCount >= 10)  tryUnlock('create_10_reviewers');

            const { user, earnedAchievements, achievementQueue } =
              xpGain > 0 ? applyXpGain(s.user, newEarned, newQueue, xpGain)
                         : { user: s.user, earnedAchievements: newEarned, achievementQueue: newQueue };

            return { reviewerCount: newCount, user, earnedAchievements, achievementQueue };
          });
        } else {
          set(s => ({ reviewerCount: s.reviewerCount + 1 }));
        }
      },

      pollSourceFile: async (folderId, fileId) => {
        try {
          const row = await foldersApi.getFile(fileId);
          set(s => ({
            sourceFiles: {
              ...s.sourceFiles,
              [folderId]: (s.sourceFiles[folderId] ?? []).map(f => f.id === fileId ? row : f),
            },
          }));
          return row;
        } catch { return null; }
      },

      // ── Outputs ──────────────────────────────────────────────
      loadFolderOutputs: async (folderId) => {
        const [flashcards, mcqs, pdfOutputs] = await Promise.all([
          outputsApi.listFlashcards(folderId),
          outputsApi.listMcqs(folderId),
          outputsApi.listOutputs(folderId),
        ]);
        const cards = buildOutputCards(flashcards, mcqs, pdfOutputs);
        set(s => ({
          flashcards: { ...s.flashcards, [folderId]: flashcards },
          mcqs:       { ...s.mcqs,       [folderId]: mcqs },
          files:      { ...s.files,      [folderId]: cards },
        }));
        return { flashcards, mcqs, pdfOutputs };
      },

      deleteFile: (folderId, fileId) =>
        set(s => ({ files: { ...s.files, [folderId]: (s.files[folderId] ?? []).filter(f => f.id !== fileId) } })),

      renameFile: (folderId, fileId, newName) =>
        set(s => ({
          files: { ...s.files, [folderId]: (s.files[folderId] ?? []).map(f => f.id === fileId ? { ...f, name: newName } : f) },
        })),

      // ── Achievements ─────────────────────────────────────────

      // Unlock a single achievement by id. No-op if offline or already earned.
      unlockAchievement: (id) => {
        if (!navigator.onLine) return;
        set(s => {
          if (s.earnedAchievements[id]) return {};
          const ach = ACHIEVEMENTS.find(a => a.id === id);
          if (!ach) return {};
          const { user, earnedAchievements, achievementQueue } =
            applyXpGain(
              s.user,
              { ...s.earnedAchievements, [id]: true },
              [...s.achievementQueue, ach],
              ach.xp,
            );
          return { user, earnedAchievements, achievementQueue };
        });
      },

      // Remove the front item from the achievement display queue
      dismissAchievement: () =>
        set(s => ({ achievementQueue: s.achievementQueue.slice(1) })),

      // ── Card mastery (Know it) ────────────────────────────────
      markCardMastered: (folderId, cardId) =>
        set(s => {
          if (s.masteredCards[folderId]?.[cardId]) return {};

          // Always update mastery tracking regardless of network
          const updMC = {
            ...s.masteredCards,
            [folderId]: { ...(s.masteredCards[folderId] ?? {}), [cardId]: true },
          };

          // Detect first-ever session for this folder (for stock_knowledge / im_him)
          const wasFolderPristine =
            Object.keys(s.masteredCards[folderId] ?? {}).length === 0 &&
            Object.keys(s.masteredMCQs[folderId]  ?? {}).length === 0;
          const newFreshFolders = wasFolderPristine && !s.sessionFreshFolders[folderId]
            ? { ...s.sessionFreshFolders, [folderId]: true }
            : s.sessionFreshFolders;
          const isFirstTry = newFreshFolders[folderId];

          // If offline: update mastery UI only — no XP, no achievements, no milestones
          if (!navigator.onLine) {
            return { masteredCards: updMC, sessionFreshFolders: newFreshFolders };
          }

          // ── XP & achievements (online only) ──────────────────
          const newTotal  = s.totalTermsMastered + 1;
          // +1 XP per 5 global terms mastered
          const termsXp   = Math.floor(newTotal / 5) > Math.floor(s.totalTermsMastered / 5) ? 1 : 0;

          const fcCount   = (s.flashcards[folderId] ?? []).length;
          const mcqCount  = (s.mcqs[folderId]        ?? []).length;
          const denom     = fcCount + mcqCount;

          let bonusXp = 0;
          let newMS   = s.masteredSets;
          let newEarned = { ...s.earnedAchievements };
          let newQueue  = [...s.achievementQueue];

          if (denom > 0) {
            const masterCount = Object.keys(updMC[folderId]).length
                              + Object.keys(s.masteredMCQs[folderId] ?? {}).length;
            const pct = (masterCount / denom) * 100;
            const k95 = `${folderId}-95`, k100 = `${folderId}-100`;

            if (pct >= 100 && !newMS[k100]) {
              bonusXp += 10;
              newMS = { ...newMS, [k100]: true };
              // Ace achievement (100% + 20+ terms)
              if (denom >= 20 && !newEarned['ace_first_test']) {
                const ach = ACHIEVEMENTS.find(a => a.id === 'ace_first_test');
                if (ach) { newEarned['ace_first_test'] = true; newQueue.push(ach); bonusXp += ach.xp; }
              }
              // I'm Him (100% on very first try)
              if (isFirstTry && denom >= 20 && !newEarned['im_him']) {
                const ach = ACHIEVEMENTS.find(a => a.id === 'im_him');
                if (ach) { newEarned['im_him'] = true; newQueue.push(ach); bonusXp += ach.xp; }
              }
            }
            if (pct >= 95 && !newMS[k95]) {
              bonusXp += 5;
              newMS = { ...newMS, [k95]: true };
              if (denom >= 20 && !newEarned['reach_95_mastery']) {
                const ach = ACHIEVEMENTS.find(a => a.id === 'reach_95_mastery');
                if (ach) { newEarned['reach_95_mastery'] = true; newQueue.push(ach); bonusXp += ach.xp; }
              }
            }
            // Stock Knowledge (50%+ on very first try, 20+ terms)
            if (isFirstTry && pct >= 50 && denom >= 20 && !newEarned['stock_knowledge']) {
              const ach = ACHIEVEMENTS.find(a => a.id === 'stock_knowledge');
              if (ach) { newEarned['stock_knowledge'] = true; newQueue.push(ach); bonusXp += ach.xp; }
            }
          }

          const { user, earnedAchievements, achievementQueue } =
            applyXpGain(s.user, newEarned, newQueue, termsXp + bonusXp);

          return {
            masteredCards: updMC,
            masteredSets:  newMS,
            sessionFreshFolders: newFreshFolders,
            totalTermsMastered: newTotal,
            user,
            earnedAchievements,
            achievementQueue,
          };
        }),

      // ── MCQ correct answer ────────────────────────────────────
      markMCQResult: (folderId, qId, isCorrect) =>
        set(s => {
          if (!isCorrect || s.masteredMCQs[folderId]?.[qId]) return {};

          const updMQ = {
            ...s.masteredMCQs,
            [folderId]: { ...(s.masteredMCQs[folderId] ?? {}), [qId]: true },
          };

          const wasFolderPristine =
            Object.keys(s.masteredCards[folderId] ?? {}).length === 0 &&
            Object.keys(s.masteredMCQs[folderId]  ?? {}).length === 0;
          const newFreshFolders = wasFolderPristine && !s.sessionFreshFolders[folderId]
            ? { ...s.sessionFreshFolders, [folderId]: true }
            : s.sessionFreshFolders;
          const isFirstTry = newFreshFolders[folderId];

          if (!navigator.onLine) {
            return { masteredMCQs: updMQ, sessionFreshFolders: newFreshFolders };
          }

          const newTotal = s.totalTermsMastered + 1;
          const termsXp  = Math.floor(newTotal / 5) > Math.floor(s.totalTermsMastered / 5) ? 1 : 0;

          const denom = (s.flashcards[folderId] ?? []).length + (s.mcqs[folderId] ?? []).length;
          let bonusXp = 0;
          let newMS   = s.masteredSets;
          let newEarned = { ...s.earnedAchievements };
          let newQueue  = [...s.achievementQueue];

          if (denom > 0) {
            const masterCount = Object.keys(s.masteredCards[folderId] ?? {}).length
                              + Object.keys(updMQ[folderId]).length;
            const pct = (masterCount / denom) * 100;
            const k95 = `${folderId}-95`, k100 = `${folderId}-100`;

            if (pct >= 100 && !newMS[k100]) {
              bonusXp += 10; newMS = { ...newMS, [k100]: true };
              if (denom >= 20 && !newEarned['ace_first_test']) {
                const ach = ACHIEVEMENTS.find(a => a.id === 'ace_first_test');
                if (ach) { newEarned['ace_first_test'] = true; newQueue.push(ach); bonusXp += ach.xp; }
              }
              if (isFirstTry && denom >= 20 && !newEarned['im_him']) {
                const ach = ACHIEVEMENTS.find(a => a.id === 'im_him');
                if (ach) { newEarned['im_him'] = true; newQueue.push(ach); bonusXp += ach.xp; }
              }
            }
            if (pct >= 95 && !newMS[k95]) {
              bonusXp += 5; newMS = { ...newMS, [k95]: true };
              if (denom >= 20 && !newEarned['reach_95_mastery']) {
                const ach = ACHIEVEMENTS.find(a => a.id === 'reach_95_mastery');
                if (ach) { newEarned['reach_95_mastery'] = true; newQueue.push(ach); bonusXp += ach.xp; }
              }
            }
            if (isFirstTry && pct >= 50 && denom >= 20 && !newEarned['stock_knowledge']) {
              const ach = ACHIEVEMENTS.find(a => a.id === 'stock_knowledge');
              if (ach) { newEarned['stock_knowledge'] = true; newQueue.push(ach); bonusXp += ach.xp; }
            }
          }

          const { user, earnedAchievements, achievementQueue } =
            applyXpGain(s.user, newEarned, newQueue, termsXp + bonusXp);

          return {
            masteredMCQs: updMQ,
            masteredSets:  newMS,
            sessionFreshFolders: newFreshFolders,
            totalTermsMastered: newTotal,
            user,
            earnedAchievements,
            achievementQueue,
          };
        }),

      // ── Reviewed card (any rating, for review_all_terms tracking) ──
      markCardReviewed: (folderId, cardId) =>
        set(s => ({
          reviewedCards: {
            ...s.reviewedCards,
            [folderId]: { ...(s.reviewedCards[folderId] ?? {}), [cardId]: true },
          },
        })),

      // ── Complete a review session ─────────────────────────────
      completeReviewSession: (folderId) => {
        if (!navigator.onLine) return;
        set(s => {
          const newCount = s.reviewSessionCount + 1;
          let newEarned = { ...s.earnedAchievements };
          let newQueue  = [...s.achievementQueue ];
          let xpGain = 0;

          const tryUnlock = (id) => {
            if (!newEarned[id]) {
              const ach = ACHIEVEMENTS.find(a => a.id === id);
              if (ach) { newEarned[id] = true; newQueue.push(ach); xpGain += ach.xp; }
            }
          };

          tryUnlock('finish_review'); // first ever session

          if (newCount >= 10) tryUnlock('review_10_times');
          if (newCount >= 20) tryUnlock('review_20_times');

          // review_all_terms: all cards reviewed (any rating), 20+ terms
          const fcTotal = (s.flashcards[folderId] ?? []).length;
          const mcqTotal = (s.mcqs[folderId] ?? []).length;
          const totalTerms = fcTotal + mcqTotal;
          const reviewedCount = Object.keys(s.reviewedCards[folderId] ?? {}).length;
          if (totalTerms >= 20 && reviewedCount >= totalTerms) {
            tryUnlock('review_all_terms');
          }

          const { user, earnedAchievements, achievementQueue } =
            xpGain > 0
              ? applyXpGain(s.user, newEarned, newQueue, xpGain)
              : { user: s.user, earnedAchievements: newEarned, achievementQueue: newQueue };

          return { reviewSessionCount: newCount, user, earnedAchievements, achievementQueue };
        });
      },

      // ── Legacy addXp (online-only) ────────────────────────────
      addXp: (amount) => {
        if (!navigator.onLine) return;
        set(s => {
          const { user, earnedAchievements, achievementQueue } =
            applyXpGain(s.user, s.earnedAchievements, s.achievementQueue, amount);
          return { user, earnedAchievements, achievementQueue };
        });
      },

      updateMastery: (id, newScore) =>
        set(s => ({
          masteryData: s.masteryData.map(item => item.id === id ? { ...item, score: newScore } : item),
        })),
    }),
    {
      name: 'reviewbot-gamification',
      version: 1,
      partialize: s => ({
        theme:              s.theme,
        user:               s.user,
        masteredCards:      s.masteredCards,
        masteredMCQs:       s.masteredMCQs,
        reviewedCards:      s.reviewedCards,
        masteredSets:       s.masteredSets,
        totalTermsMastered: s.totalTermsMastered,
        earnedAchievements: s.earnedAchievements,
        reviewerCount:      s.reviewerCount,
        reviewSessionCount: s.reviewSessionCount,
      }),
      // achievementQueue and sessionFreshFolders are NOT persisted — intentional.
    }
  )
);
