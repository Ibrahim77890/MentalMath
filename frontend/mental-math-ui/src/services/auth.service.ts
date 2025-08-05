import axios from 'axios';

// API base URL - should be configurable from environment variables
const API_URL = process.env.API_URL || 'http://localhost:3000';

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  age?: number;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  age?: number;
}

export interface AuthResponse {
  accessToken: string;
  user: UserResponse;
}

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Auth service for handling authentication API calls
 */
export const authService = {
  /**
   * Login user and get access token
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/users/login', credentials);
    if (response.data.accessToken) {
      localStorage.setItem('auth_token', response.data.accessToken);
    }
    return response.data;
  },

  /**
   * Register a new user
   */
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/users', userData);
    if (response.data.accessToken) {
      localStorage.setItem('auth_token', response.data.accessToken);
    }
    return response.data;
  },

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>('/users/me');
    return response.data;
  },

  /**
   * Logout user (client-side only)
   */
  logout(): void {
    localStorage.removeItem('auth_token');
  },

  /**
   * Check if user has a valid token
   */
  async checkToken(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/users/forgot-password', { email });
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/users/reset-password', { token, password });
  },
};