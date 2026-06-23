import api from './client';

export const financialProfileApi = {
  get: () => api.get('/financial-profile'),
  update: (data) => api.put('/financial-profile', data),
};
