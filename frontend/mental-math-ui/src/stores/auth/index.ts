import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authService } from 'src/services/auth.service';
import type { UserResponse } from 'src/services/auth.service';
import type { LoginCredentials, RegisterData } from 'src/services/auth.service';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<UserResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const isAuthenticated = computed(() => !!user.value);

  // Actions
  async function login(credentials: LoginCredentials) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.login(credentials);
      user.value = response.user;
      return response;
    } catch (err: unknown) {
  const errorMessage = err instanceof Error 
    ? err.message 
    : err && typeof err === 'object' && 'response' in err && 
      err.response && typeof err.response === 'object' && 
      'data' in err.response && err.response.data && 
      typeof err.response.data === 'object' && 
      'message' in err.response.data && 
      typeof err.response.data.message === 'string'
      ? err.response.data.message
      : 'Login failed';
      error.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function register(userData: RegisterData) {
    loading.value = true;
    error.value = null;

    try {
      const response = await authService.register(userData);
      user.value = response.user;
      return response;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : err && typeof err === 'object' && 'response' in err && 
          err.response && typeof err.response === 'object' && 
          'data' in err.response && err.response.data && 
          typeof err.response.data === 'object' && 
          'message' in err.response.data && 
          typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Registration failed';
      error.value = errorMessage;
      throw new Error(errorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    await Promise.resolve();
    authService.logout();
    user.value = null;
  }

  async function checkAuth() {
    loading.value = true;
    
    try {
      const currentUser = await authService.getCurrentUser();
      user.value = currentUser;
      return currentUser;
    } catch (err) {
      user.value = null;
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    // State
    user,
    loading,
    error,
    
    // Computed
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    checkAuth,
  };
});