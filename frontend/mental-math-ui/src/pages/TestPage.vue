<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">Test Page</div>
    
    <!-- Debug navigation buttons -->
    <div class="q-mb-md">
      <q-btn to="/" label="Home" color="primary" class="q-mr-sm" />
      <q-btn to="/login" label="Login" color="secondary" class="q-mr-sm" />
      <q-btn to="/dashboard" label="Dashboard" color="accent" />
    </div>
    
    <div class="q-pa-md bg-primary text-white q-mt-lg">
      <div class="text-h5">Content is visible!</div>
      <p>If you can see this, your routing and basic Vue components are working.</p>
    </div>
    
    <div class="q-mt-lg">
      <div><strong>Current route:</strong> {{ route.path }}</div>
      <div><strong>Query params:</strong> {{ JSON.stringify(route.query) }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

// Get the route object
const route = useRoute();
// Simplified test page with no external dependencies
</script>