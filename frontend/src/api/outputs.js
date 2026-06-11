import { api } from './client.js';

export const outputsApi = {
  listFlashcards: (folderId) => api.get(`/folders/${folderId}/flashcards`),
  createFlashcard: (data) => api.post('/flashcards', data),
  updateFlashcard: (id, data) => api.put(`/flashcards/${id}`, data),
  deleteFlashcard: (id) => api.delete(`/flashcards/${id}`),

  listMcqs: (folderId) => api.get(`/folders/${folderId}/mcqs`),
  createMcq: (data) => api.post('/mcqs', data),
  deleteMcq: (id) => api.delete(`/mcqs/${id}`),

  listOutputs: (folderId) => api.get(`/folders/${folderId}/outputs`),
  downloadUrl: (outputId) => `http://127.0.0.1:8765/outputs/${outputId}/download`,
};
