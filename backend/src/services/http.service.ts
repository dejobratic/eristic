export interface HttpResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestOptions extends RequestInit {
  timeout?: number;
}

export class HttpService {

  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    try {
      const response = await this.makeRequest(url, {
        method: 'GET',
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`GET ${url} failed:`, error);
      throw error;
    }
  }

  async post<T, U = any>(url: string, data: U, options?: RequestOptions): Promise<T> {
    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        body: JSON.stringify(data),
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`POST ${url} failed:`, error);
      throw error;
    }
  }

  async put<T, U = any>(url: string, data: U, options?: RequestOptions): Promise<T> {
    try {
      const response = await this.makeRequest(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        body: JSON.stringify(data),
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`PUT ${url} failed:`, error);
      throw error;
    }
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    try {
      const response = await this.makeRequest(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error(`DELETE ${url} failed:`, error);
      throw error;
    }
  }

  /**
   * Check if a URL is reachable (for health checks)
   */
  async isReachable(url: string, timeout: number = 5000): Promise<boolean> {
    try {
      const response = await this.makeRequest(url, {
        method: 'GET',
        timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Build URL with query parameters
   */
  buildUrl(baseUrl: string, path: string, params?: Record<string, string | number>): string {
    const url = new URL(path, baseUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }
    
    return url.toString();
  }

  /**
   * Check if error is a network/fetch error
   */
  isNetworkError(error: any): boolean {
    return error instanceof TypeError && 
           (error.message.includes('fetch') || 
            error.message.includes('network') ||
            error.message.includes('Failed to fetch'));
  }

  /**
   * Check if error is an HTTP error
   */
  isHttpError(error: any): boolean {
    return error instanceof Error && 
           error.message.includes('HTTP');
  }

  /**
   * Extract data from API response with success/error structure
   */
  extractApiData<T>(response: HttpResponse<T>): T {
    if (!response.success) {
      throw new Error(response.error || response.message || 'API request failed');
    }
    
    if (!response.data) {
      throw new Error('No data returned from API');
    }
    
    return response.data;
  }

  /**
   * Make HTTP request with timeout support
   */
  private async makeRequest(url: string, options: RequestOptions = {}): Promise<Response> {
    const { timeout = 30000, ...fetchOptions } = options;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  }
}