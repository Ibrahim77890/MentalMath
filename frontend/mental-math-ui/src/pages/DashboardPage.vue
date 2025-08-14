<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-pa-lg">
      <!-- Top row: User info and topic selection -->
      <div class="row items-center q-mb-md">
        <div class="col-12 col-md-4">
          <q-card flat>
            <q-card-section>
              <div class="row items-center">
                <div class="col">
                  <div class="text-h6">{{ user?.name ?? 'Guest' }}</div>
                  <div class="text-caption">{{ user?.email ?? 'Not signed in' }}</div>
                </div>
                <q-avatar size="56px" class="col-auto">
                  <q-icon name="person" />
                </q-avatar>
              </div>
            </q-card-section>

            <q-separator />

            <q-card-section class="text-caption">
              <div><strong>Streak:</strong> {{ user?.streak ?? 0 }} days</div>
              <div><strong>Total Sessions:</strong> {{ user?.totalSessions ?? 0 }}</div>
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-8">
          <div class="row items-center">
            <div>
              <div class="text-subtitle1 q-mb-sm">Select Topic (Exam)</div>
              <div class="topic-list-container q-py-sm">
                <div class="row no-wrap scroll">
                  <q-btn
                    v-for="topic in topicOptions"
                    :key="topic"
                    :label="topic"
                    :color="selectedTopic === topic ? 'primary' : 'grey-3'"
                    :text-color="selectedTopic === topic ? 'white' : 'black'"
                    @click="selectTopic(topic)"
                    class="q-mx-xs"
                    padding="sm md"
                    no-caps
                    unelevated
                  />
                </div>
              </div>
            </div>

            <div class="q-ml-md">
              <q-btn color="primary" label="Start Exam" @click="openInstructions" :disable="!selectedTopic" />
            </div>
          </div>
        </div>
      </div>

      <q-separator />

      <!-- Stats summary -->
      <div class="row q-mt-lg">
        <q-card class="col-12 col-md-4 q-pa-md">
          <div class="text-h6">Overall Accuracy</div>
          <div class="text-subtitle2 q-mt-sm">{{ stats?.accuracy ?? '—' }}%</div>
        </q-card>

        <q-card class="col-12 col-md-4 q-pa-md">
          <div class="text-h6">Avg. Time / Q</div>
          <div class="text-subtitle2 q-mt-sm">{{ stats?.avgTime ?? '—' }}s</div>
        </q-card>

        <q-card class="col-12 col-md-4 q-pa-md">
          <div class="text-h6">Last Session</div>
          <div class="text-subtitle2 q-mt-sm">
            {{ recentSessions[0]?.startTime ? formatDate(recentSessions[0].startTime) : '—' }}
          </div>
        </q-card>
      </div>

      <!-- Charts -->
      <div class="row q-mt-lg">
        <q-card flat class="col-12 col-lg-7 q-pa-md">
          <div class="text-h6 q-mb-sm">Accuracy Over Time — {{ selectedTopic }}</div>
          <div class="chart-container">
            <canvas ref="accuracyCanvas"></canvas>
          </div>
        </q-card>

        <q-card flat class="col-12 col-lg-5 q-pa-md">
          <div class="text-h6 q-mb-sm">Average Time by Topic</div>
          <div class="chart-container">
            <canvas ref="timeCanvas"></canvas>
          </div>
        </q-card>
      </div>

      <!-- Recent sessions list -->
      <div class="q-mt-lg" v-if="recentSessions.length">
        <q-list bordered>
          <q-item-label header>Recent Sessions</q-item-label>
          <q-item v-for="session in recentSessions" :key="session.id" clickable v-ripple @click="viewSession(session.id)">
            <q-item-section>
              <div>{{ formatDate(session.startTime) }} - {{ session.topicOrder.join(', ') }}</div>
              <div class="text-caption">Accuracy: {{ session.accuracy }}%, Duration: {{ session.duration }}m</div>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-card>

    <!-- Instructions dialog -->
    <q-dialog v-model="instructionsOpen" persistent>
      <q-card style="min-width: 420px; max-width: 720px; color: white">
        <q-card-section>
          <div class="text-h6">Exam Instructions — {{ selectedTopic }}</div>
          <div class="text-caption q-mt-sm">
            Read these instructions carefully before starting your timed exam.
          </div>
        </q-card-section>

        <q-card-section>
          <ul>
            <li>Duration: 60 minutes (1-hour session)</li>
            <li>Number of questions: Mixed — adaptive difficulty</li>
            <li>Tips: Use mental techniques (chunking, complements, doubling). Hints available but may affect score.</li>
            <li>Do not refresh the page during the exam — progress is saved periodically.</li>
          </ul>

          <div v-if="selectedTopic === 'WordProblem'" class="q-mt-sm">
            <strong>Word problem tip:</strong> read carefully and write down unknowns before calculating.
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup @click="instructionsOpen = false" />
          <q-btn color="primary" label="Start Session" @click="confirmStartSession" :loading="starting" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import axios from 'axios';
import Chart from 'chart.js/auto';
import type { Chart as ChartJS, ChartTypeRegistry } from 'chart.js';

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

interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  streak?: number;
  totalSessions?: number;
}

const $q = useQuasar();
const router = useRouter();

// Topics & selection
const topicOptions = ref<string[]>(['Arithmetic', 'Algebra', 'DiffEq', 'WordProblem']);
const selectedTopic = ref<string>(topicOptions.value[0] || 'Arithmetic');

// Data containers
const user = ref<UserProfile | null>(null);
const stats = ref<Stats | null>(null);
const recentSessions = ref<SessionSummary[]>([]);
const topicProgress = ref<Record<string, { labels: string[]; accuracy: number[]; avgTime: number[] }>>({});

// Chart refs & instances
const accuracyCanvas = ref<HTMLCanvasElement | null>(null);
const timeCanvas = ref<HTMLCanvasElement | null>(null);

let accuracyChart: ChartJS<'line', (number | undefined)[], string> | null = null;
let timeChart: ChartJS<'bar', (number | undefined)[], string> | null = null;

// Dialog
const instructionsOpen = ref(false);
const starting = ref(false);

// helpers
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

async function fetchUserProfile() {
  try {
    const res = await axios.get('/api/me');
    user.value = res.data;
  } catch {
    // fallback to demo file
    try {
      const r = await axios.get('/data.json');
      const u = r?.data?.users?.[0];
      user.value = {
        name: u?.name ?? 'Guest',
        email: u?.email ?? '',
        streak: 3,
        totalSessions: r?.data?.sessions?.length ?? 0
      };
    } catch {
      user.value = { name: 'Guest', email: '', streak: 0, totalSessions: 0 };
    }
  }
}

async function fetchDashboardForTopic(topic: string) {
  try {
    const res = await axios.get<{ stats: Stats; chart?: any; recent?: SessionSummary[] }>(`/api/dashboard?topic=${encodeURIComponent(topic)}`);
    stats.value = res.data.stats;
    recentSessions.value = res.data.recent ?? [];
    // if chart provided by API, use it; else generate demo
    if (res.data.chart) {
      topicProgress.value[topic] = {
        labels: res.data.chart.labels ?? [],
        accuracy: res.data.chart.accuracyData ?? [],
        avgTime: res.data.chart.timeData ?? []
      };
    } else {
      // fallback demo
      topicProgress.value[topic] = {
        labels: ['Session 1', 'Session 2', 'Session 3', 'Session 4'],
        accuracy: [70, 80, 85, 88],
        avgTime: [45, 40, 38, 36]
      };
    }
  } catch {
    // fallback
    try {
      const r = await axios.get('/data.json');
      const d = r?.data?.dashboard?.[topic];
      if (d) {
        topicProgress.value[topic] = {
          labels: d.chart?.labels ?? ['Session 1', 'Session 2'],
          accuracy: d.chart?.accuracyData ?? [50, 60],
          avgTime: d.chart?.timeData ?? [60, 50]
        };
        stats.value = d.stats ?? null;
        recentSessions.value = d.recent ?? [];
      } else {
        topicProgress.value[topic] = {
          labels: ['Session 1', 'Session 2', 'Session 3'],
          accuracy: [60, 70, 75],
          avgTime: [55, 52, 50]
        };
      }
    } catch {
      // final fallback
      topicProgress.value[topic] = {
        labels: ['S1', 'S2', 'S3'],
        accuracy: [60, 65, 72],
        avgTime: [60, 58, 52]
      };
    }
  }
}

function renderAccuracyChart(topic: string) {
  if (!accuracyCanvas.value) return;
  if (accuracyChart) {
    accuracyChart.destroy();
    accuracyChart = null;
  }
  const d = topicProgress.value[topic] || { labels: [], accuracy: [], avgTime: [] };
  accuracyChart = new Chart(accuracyCanvas.value, {
    type: 'line',
    data: {
      labels: d.labels,
      datasets: [
        {
          label: `${topic} accuracy %`,
          data: d.accuracy,
          fill: false,
          tension: 0.3,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 10 }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function renderTimeChart() {
  if (!timeCanvas.value) return;
  if (timeChart) {
    timeChart.destroy();
    timeChart = null;
  }
  // build per-topic average time across topicOptions
  const labels = topicOptions.value.slice();
  const data = labels.map(t => {
    const entry = topicProgress.value[t];
    if (!entry) return 0;
    // take last avgTime if available
    const arr = entry.avgTime;
    return arr && arr.length ? arr[arr.length - 1] : 0;
  });

  timeChart = new Chart(timeCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Avg time (s)',
          data,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// react to selectedTopic changes
async function refreshAllForTopic(topic: string) {
  await fetchDashboardForTopic(topic);
  renderAccuracyChart(topic);
  renderTimeChart();
}

// topic selection
function selectTopic(topic: string) {
  selectedTopic.value = topic;
}

// instructions modal
function openInstructions() {
  if (!selectedTopic.value) {
    $q.notify({ type: 'warning', message: 'Please pick a topic first.' });
    return;
  }
  instructionsOpen.value = true;
}

// start session confirmed
async function confirmStartSession() {
  starting.value = true;
  try {
    // create a session with only the selectedTopic
    const payload = { userId: null, topicOrder: [selectedTopic.value] };
    const res = await axios.post('/sessions/start', payload);
    const sid = res?.data?.sessionId;
    if (!sid) throw new Error('no session id returned');
    instructionsOpen.value = false;
    $q.notify({ type: 'positive', message: 'Session started' });
    // route to session page (make sure route exists)
    // router.push({ name: 'Session', params: { sessionId: sid } });
  } catch (err) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Failed to start session' });
  } finally {
    starting.value = false;
  }
}

function viewSession(id: string) {
  // router.push({ name: 'SessionDetail', params: { id } });
}

// lifecycle
onMounted(async () => {
  await fetchUserProfile();
  // prefetch progress for all topics (so the time chart and other topics are ready)
  for (const t of topicOptions.value) {
    // ensure there's an entry
    if (!topicProgress.value[t]) {
      // initialize default to avoid undefined
      topicProgress.value[t] = { labels: [], accuracy: [], avgTime: [] };
    }
    // fetch individually but don't block UI
    await fetchDashboardForTopic(t);
  }
  // initial render for the selected topic
  await refreshAllForTopic(selectedTopic.value);
});

// watch topic changes
watch(selectedTopic, async (newTopic) => {
  await refreshAllForTopic(newTopic);
});

onBeforeUnmount(() => {
  if (accuracyChart) {
    accuracyChart.destroy();
    accuracyChart = null;
  }
  if (timeChart) {
    timeChart.destroy();
    timeChart = null;
  }
});
</script>

<style scoped>
.chart-container {
  height: 320px;
  position: relative;
}
.topic-list-container .scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
