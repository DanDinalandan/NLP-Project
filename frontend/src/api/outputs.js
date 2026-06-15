import { api } from './client.js';

export const outputsApi = {
  listFlashcards:    (folderId) => api.get(`/folders/${folderId}/flashcards`),
  createFlashcard:   (data)     => api.post('/flashcards', data),
  updateFlashcard:   (id, data) => api.put(`/flashcards/${id}`, data),
  deleteFlashcard:   (id)       => api.delete(`/flashcards/${id}`),
  deleteAllFlashcards: (folderId) => api.delete(`/folders/${folderId}/flashcards/all`),

  listMcqs:    (folderId) => api.get(`/folders/${folderId}/mcqs`),
  createMcq:   (data)     => api.post('/mcqs', data),
  updateMcq:   (id, data) => api.put(`/mcqs/${id}`, data),
  deleteMcq:   (id)       => api.delete(`/mcqs/${id}`),
  deleteAllMcqs: (folderId) => api.delete(`/folders/${folderId}/mcqs/all`),

  listFibs:     (folderId) => api.get(`/folders/${folderId}/fibs`),
  createFib:    (data)     => api.post('/fibs', data),
  updateFib:    (id, data) => api.put(`/fibs/${id}`, data),
  deleteFib:    (id)       => api.delete(`/fibs/${id}`),
  deleteAllFibs: (folderId) => api.delete(`/folders/${folderId}/fibs/all`),

  listOutputs:  (folderId) => api.get(`/folders/${folderId}/outputs`),
  deleteOutput: (id)       => api.delete(`/outputs/${id}`),
  downloadUrl:  (outputId) => `http://127.0.0.1:8765/outputs/${outputId}/download`,
  contentUrl:   (outputId) => `http://127.0.0.1:8765/outputs/${outputId}/content`,
  exportDocxUrl: (type, outputId, folderId) => {
    if (type === 'Flashcard') return `http://127.0.0.1:8765/folders/${folderId}/flashcards/export/docx`;
    if (type === 'MCQ')       return `http://127.0.0.1:8765/folders/${folderId}/mcqs/export/docx`;
    return `http://127.0.0.1:8765/outputs/${outputId}/export/docx`;
  },
  exportCsvUrl: (folderId) => `http://127.0.0.1:8765/folders/${folderId}/mcqs/export/csv`,
};
