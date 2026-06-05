import { create } from "zustand";
import { USER, FOLDERS } from "../data/mockData";

const FOLDER_OUTPUTS = {
  1: [
    { id: 101, name: "Topic 1 Flashcards",  type: "Flashcard", col: 1, created: "2h ago"      },
    { id: 102, name: "Chapter 4 MCQ Set",   type: "MCQ",       col: 2, created: "Yesterday"   },
    { id: 103, name: "Lecture 7 Summary",   type: "Summary",   col: 3, created: "3 days ago"  },
  ],
  2: [
    { id: 201, name: "Formula Sheet FIB",   type: "FIB",       col: 1, created: "1 day ago"   },
  ],
};

export const useStore = create((set) => ({
  user: USER,
  masteryData: [
    { id: 101, name: "Topic 1 Flashcards", score: 8, total: 10, type: "Flashcard" },
    { id: 102, name: "Chapter 4 MCQ Set",  score: 5, total: 10, type: "MCQ" },
    { id: 103, name: "Lecture 7 Summary",  score: 10, total: 10, type: "Summary" }
  ],
  
  folders: FOLDERS,
  files: FOLDER_OUTPUTS,

  addFolder: (newFolder) => set((state) => ({ 
    folders: [...state.folders, newFolder] 
  })),
  
  renameFolder: (id, newName) => set((state) => ({
    folders: state.folders.map(f => f.id === id ? { ...f, name: newName } : f)
  })),
  
  deleteFolder: (id) => set((state) => {
    const newFiles = { ...state.files };
    delete newFiles[id]; 
    return {
      folders: state.folders.filter(f => f.id !== id),
      files: newFiles
    };
  }),

  deleteFile: (folderId, fileId) => set((state) => ({
    files: {
      ...state.files,
      [folderId]: state.files[folderId].filter(f => f.id !== fileId)
    }
  })),

  renameFile: (folderId, fileId, newName) => set((state) => ({
    files: {
      ...state.files,
      [folderId]: state.files[folderId].map(f => 
        f.id === fileId ? { ...f, name: newName } : f
      )
    }
  })),

  addXp: (amount) => set((state) => {
    let newXp = state.user.xp + amount;
    let newLevel = state.user.level;
    if (newXp >= state.user.xpMax) {
      newXp = newXp - state.user.xpMax;
      newLevel += 1;
    }
    return { user: { ...state.user, xp: newXp, level: newLevel } };
  }),

  updateMastery: (id, newScore) => set((state) => ({
    masteryData: state.masteryData.map(item => 
      item.id === id ? { ...item, score: newScore } : item
    )
  }))
}));