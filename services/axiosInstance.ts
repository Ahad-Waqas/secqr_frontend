import axios from 'axios';

let accessToken = '';
let refreshTokenValue = ''; // Store refresh token in memory

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => {
    // Store refresh token after successful login
    if (response.config.url.includes('/auth/login') && response.data.data.refreshToken) {
      refreshTokenValue = response.data.data.refreshToken;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log detailed error information
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: originalRequest?.url,
        method: originalRequest?.method,
      });
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const headers = {};
          if (refreshTokenValue) {
            headers['X-Refresh-Token'] = refreshTokenValue;
          }

          const res = await axios.post(
            '/api/auth/refresh-token',
            {},
            { 
              withCredentials: true,
              headers: headers
            }
          );
          
          accessToken = res.data.data.accessToken;
          // Update refresh token if new one is provided
          if (res.data.data.refreshToken) {
            refreshTokenValue = res.data.data.refreshToken;
          }
          
          onRefreshed(accessToken);
        } catch (err) {
          console.error('Refresh failed:', err);
          accessToken = '';
          refreshTokenValue = '';
          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return new Promise((resolve) => {
        subscribeTokenRefresh((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export function setAccessToken(token) {
  accessToken = token;
}

export default api;