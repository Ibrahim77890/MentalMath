<template>
  <q-layout view="hHh lpR fFf" class="dashboard-layout">
    <!-- Header -->
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>MentalMath Dashboard</q-toolbar-title>
        
        <!-- User info and avatar section -->
        <div class="row items-center no-wrap">
          <div class="text-right q-mr-sm">
            <div class="text-weight-bold">{{ userName }}</div>
            <div class="text-caption">{{ userRole }}</div>
          </div>
          
          <q-avatar>
            <img :src="userAvatar" alt="User avatar">
            <q-menu>
              <q-list style="min-width: 150px">
                <q-item clickable v-close-popup @click="goToProfile">
                  <q-item-section>Profile</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="goToSettings">
                  <q-item-section>Settings</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="logout">
                  <q-item-section>Logout</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-avatar>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Navigation Drawer
    <q-drawer show-if-above v-model="drawer" side="left" bordered>
      <q-list padding>
        <q-item clickable v-ripple @click="navigate('/')">
          <q-item-section>Home</q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="navigate('/dashboard')">
          <q-item-section>Analytics</q-item-section>
        </q-item>
      </q-list>
    </q-drawer> -->

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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from 'src/composables/useAuth';

const drawer = ref<boolean>(true);
const router = useRouter();
const { user, fetchCurrentUser, logout } = useAuth();

const userName = computed(() => user.value?.fullName || 'Guest');
const userRole = computed(() => user.value?.role || 'Student');
const userAvatar = ref('https://cdn.quasar.dev/img/avatar.png'); // Default avatar

onMounted(async () => {
  await fetchCurrentUser();
});

async function navigate(path: string): Promise<void> {
  await router.push(path);
}

function goToProfile(): void {
  // router.push('/profile');
}

function goToSettings(): void {
  // router.push('/settings');
}

async function handleLogout(): Promise<void> {
  try {
    logout();
    await router.push('/login');
  } catch (error) {
    console.error('Logout failed', error);
  }
}
</script>

<style scoped>
.dashboard-layout {
  background: #020202;
}

:deep(.q-header) {
  background: rgba(2, 2, 2, 0.8);
  backdrop-filter: blur(10px);
}

:deep(.q-footer) {
  background: rgba(2, 2, 2, 0.8);
  backdrop-filter: blur(10px);
}
</style>
