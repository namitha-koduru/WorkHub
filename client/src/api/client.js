import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for unified response handling
api.interceptors.response.use(
  (response) => {
    // Return the response data body directly if structured with ApiResponse
    return response.data;
  },
  (error) => {
    const errorResponse = error.response?.data || {
      success: false,
      message: error.message || 'An unexpected network error occurred.',
    };
    return Promise.reject(errorResponse);
  }
);

export default api;

