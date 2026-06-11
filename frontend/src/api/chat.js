import { api } from './client.js';

export const chatApi = {
  getHistory: (folderId) => api.get(`/folders/${folderId}/chat`),
  // file_ids: null = query all files in folder; array = restrict to those file IDs
  send: (folderId, content, file_ids = null) =>
    api.post(`/folders/${folderId}/chat`, { content, file_ids }),
  clear: (folderId) => api.delete(`/folders/${folderId}/chat`),
};
