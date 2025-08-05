import { boot } from 'quasar/wrappers';
import type { Router } from 'vue-router';

export default boot(({ app, router }) => {
  // Add a simple navigation guard for debugging
  router.beforeEach((to, from, next) => {
    console.log('Navigating:', { from: from.path, to: to.path });
    next();
  });
});

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $router: Router;
  }
}