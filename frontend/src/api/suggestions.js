import api from './client';

export const suggestionsApi = {
  payoff: () => api.get('/suggestions/payoff'),
};
