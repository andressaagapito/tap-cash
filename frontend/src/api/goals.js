import api from './client';

export const goalsApi = {
  list: () => api.get('/goals'),
  get: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  createOption: (goalId, data) => api.post(`/goals/${goalId}/options`, data),
  updateOption: (goalId, optionId, data) => api.put(`/goals/${goalId}/options/${optionId}`, data),
  deleteOption: (goalId, optionId) => api.delete(`/goals/${goalId}/options/${optionId}`),
};
