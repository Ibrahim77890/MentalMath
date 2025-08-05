import { route } from 'quasar/wrappers'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
  type NavigationGuardNext,
  type RouteLocationNormalized
} from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'src/stores/auth'

export default route(function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Example guard: Enable when your auth store is complete
  // Router.beforeEach(async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
  //   const publicPages = ['/login', '/register', '/forgot-password', '/reset-password']
  //   const authRequired = !publicPages.includes(to.path)
  //   const authStore = useAuthStore()

  //   if (!authStore.isAuthenticated && localStorage.getItem('auth_token')) {
  //     try {
  //       await authStore.checkAuth()
  //     } catch (error) {
  //       await authStore.logout()
  //     }
  //   }

  //   if (authRequired && !authStore.isAuthenticated) {
  //     return next({ path: '/login', query: { returnUrl: to.fullPath } })
  //   } else if (!authRequired && authStore.isAuthenticated) {
  //     return next({ path: '/dashboard' })
  //   }

  //   next()
  // })

  // Basic debug-only navigation guard
  Router.beforeEach((to, from, next) => {
    console.log('Navigating to:', to.fullPath)
    next()
  })

  return Router
})
