// Enhanced API utility with session timeout support
// Automatically includes last activity timestamp in all API calls

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Make API request with session timeout headers
 */
export async function apiRequest(endpoint, options = {}) {
  try {
    const token = localStorage.getItem('token');
    const lastActivity = localStorage.getItem('lastActivity') || Date.now().toString();
    
    const headers = {
      'Content-Type': 'application/json',
      'x-last-activity': lastActivity,
      ...options.headers,
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
      ...options,
      headers,
    };
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Check for session timeout response
    if (response.status === 401) {
      const data = await response.json();
      if (data.code === 'SESSION_TIMEOUT') {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('lastActivity');
        
        // Redirect to login
        window.location.href = '/login';
        throw new Error(data.message);
      }
    }
    
    // Update last activity on successful request
    if (response.ok) {
      localStorage.setItem('lastActivity', Date.now().toString());
    }
    
    return response;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

/**
 * GET request with session timeout
 */
export async function apiGet(endpoint, options = {}) {
  return apiRequest(endpoint, {
    method: 'GET',
    ...options,
  });
}

/**
 * POST request with session timeout
 */
export async function apiPost(endpoint, data, options = {}) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * PUT request with session timeout
 */
export async function apiPut(endpoint, data, options = {}) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * PATCH request with session timeout
 */
export async function apiPatch(endpoint, data, options = {}) {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
    ...options,
  });
}

/**
 * DELETE request with session timeout
 */
export async function apiDelete(endpoint, options = {}) {
  return apiRequest(endpoint, {
    method: 'DELETE',
    ...options,
  });
}
