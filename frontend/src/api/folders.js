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

  generate: (folderId) => api.post(`/folders/${folderId}/generate`),
};
