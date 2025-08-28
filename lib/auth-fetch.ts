// lib/auth-fetch.ts
// Utility to make authenticated API calls to your backend

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:5000'

interface AuthFetchOptions extends RequestInit {
  token?: string
}

// Get token from various sources
function getToken(): string | null {
  // First check if we're on the server (from middleware headers)
  if (typeof window === 'undefined') {
    return null
  }
  
  // Check localStorage first
  const localToken = localStorage.getItem('authToken')
  if (localToken) {
    return localToken
  }
  
  // Check cookies as fallback
  const cookieToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('authToken='))
    ?.split('=')[1]
  
  return cookieToken || null
}

// Authenticated fetch function
export async function authFetch(
  endpoint: string, 
  options: AuthFetchOptions = {}
): Promise<Response> {
  const { token, ...fetchOptions } = options
  
  // Use provided token or get from storage
  const authToken = token || getToken()
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>)
  }
  
  // Add authorization header if token is available
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  
  // Construct full URL
  const url = endpoint.startsWith('http') ? endpoint : `${BACKEND_URL}${endpoint}`
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers
    })
    
    // Handle 401 unauthorized - token might be expired
    if (response.status === 401) {
      // Clear invalid token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken')
        
        // Redirect to login if we're on a protected page
        if (window.location.pathname !== '/login') {
          window.location.href = `/login?redirect=${window.location.pathname}`
        }
      }
    }
    
    return response
  } catch (error) {
    console.error('Auth fetch error:', error)
    throw error
  }
}

// Convenience methods for common HTTP verbs
export const authApi = {
  get: (endpoint: string, options: AuthFetchOptions = {}) => 
    authFetch(endpoint, { ...options, method: 'GET' }),
    
  post: (endpoint: string, data?: any, options: AuthFetchOptions = {}) => 
    authFetch(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }),
    
  put: (endpoint: string, data?: any, options: AuthFetchOptions = {}) => 
    authFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }),
    
  delete: (endpoint: string, options: AuthFetchOptions = {}) => 
    authFetch(endpoint, { ...options, method: 'DELETE' }),
    
  patch: (endpoint: string, data?: any, options: AuthFetchOptions = {}) => 
    authFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    })
}

// Helper function to handle JSON responses
export async function handleJsonResponse<T = any>(response: Response): Promise<{
  success: boolean
  data?: T
  message?: string
  code?: string
}> {
  try {
    const json = await response.json()
    
    if (response.ok) {
      return {
        success: true,
        data: json.data || json,
        message: json.message
      }
    } else {
      return {
        success: false,
        message: json.message || 'Request failed',
        code: json.code
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to parse response',
      code: 'PARSE_ERROR'
    }
  }
}

// Usage examples:

// Example 1: Get current user
export async function getCurrentUser() {
  const response = await authApi.get('/api/auth/me')
  return handleJsonResponse(response)
}

// Example 2: Get users list
export async function getUsers(params?: Record<string, any>) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
  }
  
  const endpoint = `/api/users${searchParams.toString() ? `?${searchParams}` : ''}`
  const response = await authApi.get(endpoint)
  return handleJsonResponse(response)
}

// Example 3: Create user
export async function createUser(userData: {
  name: string
  email: string
  password: string
  roleId: string
  department: string
}) {
  const response = await authApi.post('/api/users', userData)
  return handleJsonResponse(response)
}

// Example 4: Login (doesn't need auth)
export async function login(email: string, password: string, rememberMe = false) {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, rememberMe })
  })
  
  const result = await handleJsonResponse(response)
  
  // Store token on successful login
  if (result.success && result.data?.token) {
    localStorage.setItem('authToken', result.data.token)
  }
  
  return result
}

// Example 5: Logout
export async function logout() {
  try {
    await authApi.post('/api/auth/logout')
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    // Always clear local storage
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    
    // Redirect to login
    window.location.href = '/login'
  }
}

// Example 6: Get merchants
export async function getMerchants(params?: Record<string, any>) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
  }
  
  const endpoint = `/api/merchants${searchParams.toString() ? `?${searchParams}` : ''}`
  const response = await authApi.get(endpoint)
  return handleJsonResponse(response)
}

// Example 7: Get dashboard data
export async function getDashboard() {
  const response = await authApi.get('/api/dashboard')
  return handleJsonResponse(response)
}