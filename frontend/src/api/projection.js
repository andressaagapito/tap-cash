import api from './client';

export const projectionApi = {
  get: (months = 12) => api.get('/projection', { params: { months } }),
};
