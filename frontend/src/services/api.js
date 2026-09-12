import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Inject JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ims_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration & Standardize Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Token expired or revoked)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Clear invalid token
      localStorage.removeItem('ims_auth_token');
      localStorage.removeItem('ims_user_profile');

      // Dispatch custom event so AuthContext can update state without hard reload
      window.dispatchEvent(new CustomEvent('ims:unauthorized', {
        detail: { message: error.response.data?.message || 'Session expired. Please log in again.' }
      }));
    }

    // Format error message
    const formattedError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Network error occurred. Please check your connection.',
      errors: error.response?.data?.errors || null,
    };

    return Promise.reject(formattedError);
  }
);

export default api;
