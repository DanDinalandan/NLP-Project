import { api } from './client.js';

export const foldersApi = {
  list: () => api.get('/folders'),
  create: (name) => api.post('/folders', { name }),
  update: (id, patch) => api.put(`/folders/${id}`, patch),
  remove: (id) => api.delete(`/folders/${id}`),

  listFiles: (folderId) => api.get(`/folders/${folderId}/files`),
  uploadFile: (folderId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.upload(`/folders/${folderId}/files`, form);
  },
  deleteFile: (fileId) => api.delete(`/files/${fileId}`),
  getFile: (fileId) => api.get(`/files/${fileId}`),
  updateFileTitle: (fileId, title) => api.put(`/files/${fileId}/title`, { title }),

  generate: (folderId, fileIds = null, options = {}) =>
    api.post(`/folders/${folderId}/generate`, {
      ...(fileIds?.length ? { file_ids: fileIds } : {}),
      options,
    }),
  cancelFile: (fileId) => api.post(`/files/${fileId}/cancel`),
};
