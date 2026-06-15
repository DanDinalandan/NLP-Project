import { api } from './client.js';

export const searchApi = {
  search:     (q)  => api.get(`/search?q=${encodeURIComponent(q)}`),
  getContent: (id) => api.get(`/search/${id}`),
};
