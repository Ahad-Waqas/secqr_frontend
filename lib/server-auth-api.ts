// lib/server-auth-api.ts
import { NextRequest } from 'next/server';

const SPRING_BOOT_BASE_URL = process.env.SPRING_BOOT_API_URL || '';

/**
 * Server-side authenticated API utility for Next.js API routes
 * Extracts and forwards authentication from client requests to Spring Boot backend
 */
export class ServerAuthApi {
  private baseURL: string;
  private authHeaders: Record<string, string>;

  constructor(request: NextRequest) {
    this.baseURL = SPRING_BOOT_BASE_URL;
    this.authHeaders = {};

    // Extract authentication headers from the incoming request
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    if (authHeader) {
      this.authHeaders['Authorization'] = authHeader;
    }
    
    if (cookieHeader) {
      this.authHeaders['Cookie'] = cookieHeader;
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.authHeaders,
        ...options.headers,
      },
    };

    
    return fetch(url, requestOptions);
  }

  async get(endpoint: string, headers?: Record<string, string>) {
    return this.makeRequest(endpoint, { 
      method: 'GET',
      headers 
    });
  }

  async post(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async put(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async delete(endpoint: string, headers?: Record<string, string>) {
    return this.makeRequest(endpoint, {
      method: 'DELETE',
      headers,
    });
  }

  async patch(endpoint: string, body?: any, headers?: Record<string, string>) {
    return this.makeRequest(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }
}

/**
 * Helper function to handle API responses consistently
 */
export async function handleServerApiResponse(response: Response) {
  try {
    // For successful deletes or empty responses
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true, data: null, status: response.status };
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      if (response.ok) {
        return { success: true, data: null, status: response.status };
      } else {
        return {
          success: false,
          error: { message: response.statusText },
          status: response.status,
        };
      }
    }

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data,
        status: response.status,
        message: data.message || data.error || response.statusText,
      };
    }

    return {
      success: true,
      data,
      status: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: response.status,
      message: 'Failed to parse response',
    };
  }
}

/**
 * Helper function to create consistent error responses
 */
export function createServerErrorResponse(
  error: any,
  defaultStatus: number = 500,
  defaultMessage: string = 'Internal server error'
) {
  const status = error.status || defaultStatus;
  const message = error.message || error.error || defaultMessage;

  return {
    status,
    message,
    error: error instanceof Error ? error.message : error,
  };
}
