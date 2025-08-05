<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header -->
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>MentalMath Dashboard</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- Navigation Drawer -->
    <q-drawer show-if-above v-model="drawer" side="left" bordered>
      <q-list padding>
        <q-item clickable v-ripple @click="navigate('/')">
          <q-item-section>Home</q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="navigate('/dashboard')">
          <q-item-section>Analytics</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- Main Content -->
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Footer -->
    <q-footer class="text-center">
      <div class="text-caption">© 2025 MentalMath</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const drawer = ref<boolean>(true);
const router = useRouter();

async function navigate(path: string): Promise<void> {
  await router.push(path);
}
</script>

<style scoped>
/* Add custom styles here */
</style>
