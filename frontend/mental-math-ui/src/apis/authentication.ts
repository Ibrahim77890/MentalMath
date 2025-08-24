import axios from 'axios';

// General API response interface
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// User data interface
export interface User {
  id: string;
  fullName: string;
  age: number;
  email: string;
  role: string;
  token?: string;
}

// Login response interface
export interface LoginResponse {
  user: User;
  accessToken: string;
}

// Register response interface (could be just User or with token)
export interface RegisterResponse {
  user: User;
  accessToken?: string;
}

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

export class AuthenticationAPI {
  static async login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await axios.post<ApiResponse<LoginResponse>>(`${API_BASE_URL}/users/login`, {
      email,
      password,
    });
    return response.data;
  }

  static async register(
    fullName: string,
    age: number,
    email: string,
    password: string
  ): Promise<ApiResponse<RegisterResponse>> {
    const response = await axios.post<ApiResponse<RegisterResponse>>(`${API_BASE_URL}/users`, {
      fullName,
      age,
      email,
      password,
    });
    return response.data;
  }

  static async getCurrentUserDetails(token: string): Promise<ApiResponse<User>> {
    const response = await axios.get<ApiResponse<User>>(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
}