import { ref } from 'vue'
import type { User } from '../apis/authentication';
import { AuthenticationAPI } from '../apis/authentication'

const user = ref<User | null>(null)
const token = ref<string | null>(localStorage.getItem('token'))
const loading = ref(false)
const error = ref<string | null>(null)

export function useAuth() {
  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const res = await AuthenticationAPI.login(email, password)
      console.log(res);
      if (res.success) {
        user.value = res.data.user
        token.value = res.data.accessToken
        localStorage.setItem('token', token.value)
      } else {
        error.value = res.message || 'Login failed'
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function register(fullName: string, age: number, email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const res = await AuthenticationAPI.register(fullName, age, email, password)
      if (res.success) {
        user.value = res.data.user
        token.value = res.data.accessToken || ''
        localStorage.setItem('token', token.value)
      } else {
        error.value = res.message || 'Registration failed'
      }
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  async function fetchCurrentUser() {
    if (!token.value) return
    const res = await AuthenticationAPI.getCurrentUserDetails(token.value)
    if (res.success) user.value = res.data
  }

  return { user, token, loading, error, login, register, logout, fetchCurrentUser }
}
