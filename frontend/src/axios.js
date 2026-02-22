import axios from 'axios';

const api = axios.create({
  // Use environment variable if set, otherwise use relative path
  // If VITE_API_URL already includes /api, don't add it again
  baseURL: (() => {
    const envUrl = import.meta.env.VITE_API_URL || '';
    if (envUrl.includes('/api')) {
      return envUrl;
    }
    return envUrl ? `${envUrl}/api` : '/api';
  })(),
  timeout: 30000,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
