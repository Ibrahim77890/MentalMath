import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import type { LoginCredentials, RegisterData } from 'src/services/auth.service';

export function useAuth() {
  const authStore = useAuthStore();
  const router = useRouter();
  
  const isLoading = computed(() => authStore.loading);
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const user = computed(() => authStore.user);
  const error = computed(() => authStore.error);
  
  const returnUrl = ref<string | null>(null);
  
  onMounted(() => {
    // Capture return URL from route query if available
    const urlParams = new URLSearchParams(window.location.search);
    returnUrl.value = urlParams.get('returnUrl');
  });

  /**
   * Login user with credentials
   */
  async function login(credentials: LoginCredentials) {
    try {
      await authStore.login(credentials);
      await navigateAfterAuth();
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Register a new user
   */
  async function register(data: RegisterData) {
    try {
      await authStore.register(data);
      await navigateAfterAuth();
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Logout the current user
   */
  async function logout() {
    await authStore.logout();
    await router.push('/login');
  }

  /**
   * Check if user is authenticated
   */
  async function checkAuth() {
    return await authStore.checkAuth();
  }

  /**
   * Navigate after successful authentication
   */
  async function navigateAfterAuth() {
    // Navigate to return URL or default route
    const targetPath = returnUrl.value || '/dashboard';
    await router.push(targetPath);
  }

  return {
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated,
    isLoading,
    user,
    error
  };
}