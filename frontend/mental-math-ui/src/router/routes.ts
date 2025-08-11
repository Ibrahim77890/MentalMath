import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/DashboardLayout.vue'),
    children: [
      { path: '', name: 'dashboard', component: () => import('pages/DashboardPage.vue') },
      { path: '/dashboard', name: 'dashboardSame', component: () => import('pages/DashboardPage.vue') },
      // ...other authenticated pages
    ]
  },
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', name: 'login', component: () => import('pages/LoginPage.vue') }
    ]
  },
  {
    path: '/test',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', name: 'test', component: () => import('pages/TestPage.vue') }
    ]
  },
  // Question/Quiz routes
  {
    path: '/practice',
    component: () => import('layouts/QuestionLayout.vue'),
    meta: { requiresAuth: true },
    props: { totalQuestions: 10, timePerQuestion: 30 },
    children: [
      { path: '', name: 'practice', component: () => import('pages/QuestionPage.vue') }
    ]
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
];

export default routes;
