import { api } from './client.js';

export const settingsApi = {
  getOllamaStatus:  ()             => api.get('/settings/ollama'),
  pullModel:        (model)        => api.post('/settings/ollama/pull', { model }),
  getPullStatus:    (jobId)        => api.get(`/settings/ollama/pull-status/${jobId}`),
  installOllama:    ()             => api.post('/settings/ollama/install'),
  getInstallStatus: (jobId)        => api.get(`/settings/ollama/install-status/${jobId}`),
  getStorage:       ()             => api.get('/settings/storage'),
  getSettings:      ()             => api.get('/settings'),
  saveProfile:      (data)         => api.put('/settings/profile', data),
  checkin:          ()             => api.post('/settings/checkin'),
  clearData:        ()             => api.delete('/settings/data'),
  exportData:       ()             => api.get('/settings/export'),
  login:            (email, pw)    => api.post('/settings/auth/login', { email, password: pw }),
  logout:           ()             => api.post('/settings/auth/logout'),
  publishFolder:    (folderId)     => api.post(`/folders/${folderId}/publish`),
  unpublishFolder:  (folderId)     => api.delete(`/folders/${folderId}/publish`),
};
