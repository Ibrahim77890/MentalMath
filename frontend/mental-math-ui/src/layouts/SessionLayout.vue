<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round dense icon="chevron_left" @click="goBack" aria-label="Back" />
        <q-toolbar-title>Session — MentalMath</q-toolbar-title>
        <q-space />
        <div class="row items-center">
          <div class="q-mr-md text-caption">Session Time</div>
          <div class="text-weight-bold">{{ formattedSessionTimer }}</div>
          <q-btn flat round dense icon="chat" @click="toggleAgent" aria-label="Agent" class="q-ml-md" />
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="agentOpen" side="right" bordered :width="320">
      <q-toolbar class="text-subtitle2">Agent Coach</q-toolbar>
      <q-separator />
      <div class="q-pa-md" style="overflow:auto; max-height: calc(100vh - 120px);">
        <div v-if="agentMessages.length === 0" class="text-caption">Agent will appear here when you answer questions.</div>
        <div v-for="(m, idx) in agentMessages" :key="idx" class="q-mb-sm">
          <q-chip :color="m.type === 'hint' ? 'amber' : 'primary'" text-color="white" dense>
            {{ m.type.toUpperCase() }}
          </q-chip>
          <div class="q-mt-xs">
            <div class="text-subtitle2">{{ m.message }}</div>
            <div v-if="m.strategyTip" class="text-caption q-mt-xs"><strong>Tip:</strong> {{ m.strategyTip }}</div>
            <div class="text-caption q-mt-xs">At {{ formatDate(m.timestamp) }}</div>
          </div>
        </div>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer class="text-center">
      <div class="text-caption q-pa-sm">Good luck — practice intentionally!</div>
    </q-footer>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

const router = useRouter();
const $q = useQuasar();

const agentOpen = ref(false);

// agentMessages are provided via global event bus or simple local storage
// For simplicity, use sessionStorage as single source of truth — SessionPage pushes messages there
const agentMessages = ref<Array<{ type: string; message: string; strategyTip?: string; timestamp: string }>>(
  JSON.parse(sessionStorage.getItem('agentMessages') || '[]')
);

window.addEventListener('storage', () => {
  agentMessages.value = JSON.parse(sessionStorage.getItem('agentMessages') || '[]');
});

function toggleAgent() {
  agentOpen.value = !agentOpen.value;
}

// Session-wide timer display (SessionPage writes remaining to sessionStorage)
const sessionRemainingKey = 'sessionRemainingSeconds';
const remainingSeconds = ref<number>(parseInt(sessionStorage.getItem(sessionRemainingKey) || '3600', 10) || 3600);

// Listen for updates (SessionPage will update sessionRemainingSeconds in sessionStorage)
window.addEventListener('storage', () => {
  const s = parseInt(sessionStorage.getItem(sessionRemainingKey) || '3600', 10);
  remainingSeconds.value = isNaN(s) ? 3600 : s;
});

const formattedSessionTimer = computed(() => {
  const s = remainingSeconds.value;
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
});

function goBack() {
  $q.notify({ type: 'info', message: 'Returning to dashboard...' });
//   router.push({ name: 'Dashboard' });
}

function formatDate(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString();
}
</script>

<style scoped>
/* small layout tweaks */
.q-header { z-index: 5; }
</style>
