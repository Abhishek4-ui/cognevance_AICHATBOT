import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('neurochat_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('neurochat_token');
        localStorage.removeItem('neurochat_user');
      }
    }
    return Promise.reject(error);
  }
);

// ---------------- API SERVICES ----------------

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, username, password) => api.post('/auth/register', { email, username, password }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, new_password) => api.post('/auth/reset-password', { token, new_password }),
};

export const chatAPI = {
  getConversations: () => api.get('/chat/conversations'),
  createConversation: (title) => api.post('/chat/conversations', { title }),
  getMessages: (convId) => api.get(`/chat/conversations/${convId}/messages`),
  sendMessage: (payload) => api.post('/chat/message', payload),
  renameConversation: (convId, title) => api.put(`/chat/conversations/${convId}`, { title }),
  deleteConversation: (convId) => api.delete(`/chat/conversations/${convId}`),
  clearConversation: (convId) => api.delete(`/chat/conversations/${convId}/clear`),
  submitFeedback: (msgId, rating, comment) => api.post(`/chat/messages/${msgId}/feedback`, { rating, comment }),
};

export const nlpAPI = {
  preprocess: (text) => api.post('/nlp/preprocess', { text }),
  classify: (text, model) => api.post('/nlp/classify', { text, model }),
  getModels: () => api.get('/nlp/models'),
  setActiveModel: (model) => api.post('/nlp/set-active-model', { model }),
  setThreshold: (threshold) => api.post('/nlp/set-threshold', { threshold }),
  getMetrics: () => api.get('/nlp/metrics'),
  checkSimilarity: (text1, text2) => api.post('/nlp/similarity', { text1, text2 }),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  toggleUserStatus: (userId) => api.put(`/admin/users/${userId}/toggle-status`),
  getUnanswered: () => api.get('/admin/unanswered'),
  resolveUnanswered: (id, payload) => api.post(`/admin/unanswered/${id}/resolve`, payload),
  getFeedback: () => api.get('/admin/feedback'),
  getLogs: () => api.get('/admin/logs'),
  triggerRetrain: () => api.post('/admin/retrain'),
};

export const predictAIAPI = {
  getAll: () => api.get('/predictai/all'),
  getBank: () => api.get('/predictai/bank'),
  getStudent: () => api.get('/predictai/student'),
  getRetail: () => api.get('/predictai/retail'),
};

export const datasetAPI = {
  getManifest: () => api.get('/datasets/manifest'),
  getIntents: () => api.get('/datasets/intents'),
  addIntent: (payload) => api.post('/datasets/intents', payload),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
