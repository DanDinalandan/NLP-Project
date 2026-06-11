import { api } from './client.js';

export const settingsApi = {
  getOllamaStatus: () => api.get('/settings/ollama'),
  getStorage: () => api.get('/settings/storage'),
  getSettings: () => api.get('/settings'),
  clearData: () => api.delete('/settings/data'),
  exportData: () => api.get('/settings/export'),
  login: (email, password) => api.post('/settings/auth/login', { email, password }),
  logout: () => api.post('/settings/auth/logout'),
};
