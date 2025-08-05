<template>
  <div class="router-debug q-pa-md bg-grey-3 q-mb-md">
    <h5 class="q-mt-none q-mb-sm">Router Debug</h5>
    <div>
      <strong>Current Route:</strong> {{ route.fullPath }}
    </div>
    <div class="q-mt-sm">
      <q-btn 
        v-for="route in routes" 
        :key="route.path"
        :to="route.path"
        :label="route.name || route.path"
        color="primary"
        outline
        class="q-mr-xs q-mb-xs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const route = useRoute();

// List of routes for navigation testing
const routes = computed(() => [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/test', name: 'Test' },
  { path: '/dashboard', name: 'Dashboard' }
]);
</script>