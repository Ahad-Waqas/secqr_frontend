import api, { setAccessToken } from '@/services/axiosInstance';

export const logout = async (): Promise<void> => {
  try {
    // Call the logout endpoint
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear the access token regardless of API call success
    setAccessToken('');
    
    // Clear any local storage items if needed
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    
    // Redirect to login page
    window.location.href = '/login';
  }
};

export const logoutAllDevices = async (): Promise<void> => {
  try {
    // Call the logout all devices endpoint
    await api.post('/auth/logout-all');
  } catch (error) {
    console.error('Logout all devices error:', error);
  } finally {
    // Clear the access token regardless of API call success
    setAccessToken('');
    
    // Clear any local storage items if needed
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
    
    // Redirect to login page
    window.location.href = '/login';
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
};
