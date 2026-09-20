import axios from 'axios';

const API_BASE_URL = '';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Don't override Content-Type if it's already set (e.g., for FormData)
    if (config.headers['Content-Type'] === 'multipart/form-data') {
      delete config.headers['Content-Type']; // Let browser set it with boundary
    }
    
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { token } = response.data.data;
        localStorage.setItem('token', token);

        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        throw refreshError;
      }
    }

    throw error;
  }
);

// Authentication API calls
export const authAPI = {
  sendOtp: async (email) => {
    const response = await apiClient.post('/api/auth/send-otp', { email });
    return response.data;
  },

  sendRegistrationOtp: async (email) => {
    const response = await apiClient.post('/api/auth/send-registration-otp', { email });
    return response.data;
  },

  verifyOtp: async (email, otp) => {
    const response = await apiClient.post('/api/auth/verify-otp', { email, otp });
    return response.data;
  },

  register: async (formData) => {
    console.log('authAPI.register called with FormData');
    try {
      const response = await axios.post('/api/auth/register', formData);
      console.log('Register API response:', response);
      return response.data;
    } catch (error) {
      console.error('authAPI.register error:', error);
      throw error;
    }
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/api/auth/refresh', { refreshToken });
    return response.data;
  },
};

// Manufacturer API calls
export const manufacturerAPI = {
  getDashboard: async () => {
    const response = await apiClient.get('/api/manufacturers/dashboard');
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/api/manufacturers/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await apiClient.put('/api/manufacturers/profile', data);
    return response.data;
  },
};

// Admin API calls
export const adminAPI = {
  // Get all manufacturers (includes pending, approved, rejected)
  getAllManufacturers: async () => {
    const response = await apiClient.get('/api/manufacturers/pending');
    return response.data;
  },

  // Get pending manufacturers only
  getPendingManufacturers: async () => {
    const response = await apiClient.get('/api/manufacturers/pending');
    return response.data;
  },

  // Get manufacturer details by ID
  getManufacturerDetails: async (id) => {
    const response = await apiClient.get('/api/manufacturers/pending');
    const manufacturers = response.data.data || [];
    return manufacturers.find(m => m.id === id);
  },

  // Approve manufacturer
  approveManufacturer: async (id) => {
    const response = await apiClient.post(`/api/manufacturers/${id}/approve`, {});
    return response.data;
  },

  // Reject manufacturer
  rejectManufacturer: async (id, reason) => {
    const response = await apiClient.post(`/api/manufacturers/${id}/reject`, { reason });
    return response.data;
  },
};

// Product API calls
export const productAPI = {
  getAll: async (params) => {
    const response = await apiClient.get('/api/products', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/api/products/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await apiClient.post('/api/products', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await apiClient.put(`/api/products/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await apiClient.delete(`/api/products/${id}`);
    return response.data;
  },
};

// Order API calls
export const orderAPI = {
  getAll: async (params) => {
    const response = await apiClient.get('/api/orders', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await apiClient.get(`/api/orders/${id}`);
    return response.data;
  },

  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/api/orders/${id}/status`, { status });
    return response.data;
  },
};

export default apiClient;
