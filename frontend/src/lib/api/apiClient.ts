import axios, { type AxiosInstance, AxiosError } from 'axios';

// Extend Axios request config to include retry flag
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Important: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // No need to add tokens manually since we're using httpOnly cookies
    // The cookies are automatically sent with requests due to withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with automatic token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Only log responses in development if needed for debugging
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet, attempt to refresh token
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the access token
        await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        // Retry the original request with the new token (cookie will be automatically included)
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - user needs to login again
        console.error('Token refresh failed:', refreshError);
        // Clear local storage and redirect to login
        localStorage.removeItem('auth-storage');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other common errors
    if (error.response) {
      switch (error.response.status) {
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Access forbidden - insufficient permissions');
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Server error - please try again later');
          break;
        default:
          if (error.response.status !== 401) {
            console.error(`Error ${error.response.status}: ${error.message}`);
          }
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('No response from server - check your connection');
    } else {
      // Something else happened
      console.error('Request error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
