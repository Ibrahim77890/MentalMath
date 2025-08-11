<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-pa-lg">
      <div class="row items-center q-mb-md">
        <div class="q-mb-md">
          <div class="text-subtitle1 q-mb-sm">Select Topic</div>
          <div class="topic-list-container q-py-sm">
            <div class="row no-wrap scroll">
              <q-btn v-for="topic in topicOptions" :key="topic" :label="topic"
                :color="selectedTopic === topic ? 'primary' : 'grey-3'"
                :text-color="selectedTopic === topic ? 'white' : 'black'" @click="selectedTopic = topic" class="q-mx-xs"
                padding="sm md" no-caps unelevated />
            </div>
          </div>
        </div>
        <q-btn class="q-ml-md" label="Start Session" color="primary" @click="startSession" />
      </div>

      <q-separator />

      <div class="row q-mt-lg" v-if="stats">
        <q-card class="col-12 col-md-6 q-pa-md">
          <div class="text-h6">Accuracy</div>
          <div class="text-subtitle2 q-mt-sm">{{ stats.accuracy }}%</div>
        </q-card>
        <q-card class="col-12 col-md-6 q-pa-md">
          <div class="text-h6">Avg. Time per Question</div>
          <div class="text-subtitle2 q-mt-sm">{{ stats.avgTime }}s</div>
        </q-card>
      </div>


      <div class="q-mt-lg" v-if="recentSessions.length">
        <q-list bordered>
          <q-item-label header>Recent Sessions</q-item-label>
          <q-item v-for="session in recentSessions" :key="session.id" clickable v-ripple
            @click="viewSession(session.id)">
            <q-item-section>
              <div>{{ formatDate(session.startTime) }} - {{ session.topicOrder.join(', ') }}</div>
              <div class="text-caption">
                Accuracy: {{ session.accuracy }}%, Duration: {{ session.duration }}m
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import axios from 'axios';

interface Stats {
  accuracy: number;
  avgTime: number;
}

interface SessionSummary {
  id: string;
  startTime: string;
  topicOrder: string[];
  accuracy: number;
  duration: number;
}

const $q = useQuasar();
const router = useRouter();

const topicOptions = ref<string[]>(['Arithmetic', 'Algebra', 'DiffEq', 'WordProblem']);
const selectedTopic = ref<string>(topicOptions.value[0] || 'Arithmetic');

const stats = ref<Stats | null>(null);
const recentSessions = ref<SessionSummary[]>([]);

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

async function fetchStats(): Promise<void> {
  try {
    const res = await axios.get<{ stats: Stats; recent: SessionSummary[] }>(
      `/api/dashboard?topic=${selectedTopic.value}`
    );
    stats.value = res.data.stats;
    recentSessions.value = res.data.recent;
  } catch {
    $q.notify({ type: 'negative', message: 'Failed to load dashboard.' });
  }
}

async function startSession(): Promise<void> {
  await router.push({ name: 'Session', params: { topic: selectedTopic.value } });
}

async function viewSession(id: string): Promise<void> {
  await router.push({ name: 'SessionDetail', params: { id } });
}

onMounted(fetchStats);
</script>

<style scoped>
.chart-container {
  height: 300px;
}
</style>
