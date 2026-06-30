import api from './client';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  forgotPasswordValidate: (data) => api.post('/auth/forgot-password/validate', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  updateProfile: (data) => api.put('/auth/profile', data),
};
