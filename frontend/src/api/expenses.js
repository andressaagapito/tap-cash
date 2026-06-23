import api from './client';

export const expensesApi = {
  dashboard: () => api.get('/expenses/dashboard'),
  list: (params) => api.get('/expenses', { params }),
  get: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  markAsPaid: (id) => api.patch(`/expenses/${id}/mark-as-paid`),
  listInstallments: (id) => api.get(`/expenses/${id}/installments`),
  markInstallmentPaid: (id, number) =>
    api.patch(`/expenses/${id}/installments/${number}/mark-paid`),
  markInstallmentUnpaid: (id, number) =>
    api.patch(`/expenses/${id}/installments/${number}/mark-unpaid`),
};
