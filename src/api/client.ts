import axios from 'axios';

// Always use a relative base path so deployments (e.g., Vercel) can rewrite `/api/*` to the backend.
// This makes all requests look like `/api/v1/...` from the browser.
const API_BASE_URL = '/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds (Canvas 동기화는 시간이 오래 걸릴 수 있음)
});

// Request interceptor - Add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - Token expired or invalid
    // BUT: Don't redirect on auth endpoints (login/signup)
    const isAuthEndpoint = error.config?.url?.includes('/auth/signin') ||
                           error.config?.url?.includes('/auth/signup');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/';
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access denied');
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      console.error('Server error occurred');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
