import api from './client';

export const backupApi = {
  exportExcel: () => api.get('/backup/export-excel', { responseType: 'blob' }),
  downloadExpensesTemplate: () => api.get('/backup/template-expenses', { responseType: 'blob' }),
  importExcel: (file) => {

    const formData = new FormData();
    formData.append('file', file);
    return api.post('/backup/import-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
