<template>
  <q-page class="dashboard-page">
    <div class="dashboard-content q-pa-md">
      <q-card flat bordered class="q-pa-lg bg-transparent">
        <!-- Top row: User info and topic selection -->
        <div class="col items-center q-mb-md">
          <div class="col-12 col-md-4">
            <q-card flat>
              <q-card-section>
                <div class="row items-center">
                  <div class="col">
                    <div class="text-h6">{{ user?.fullName ?? 'Guest' }}</div>
                    <div class="text-caption">{{ user?.email ?? 'Not signed in' }}</div>
                  </div>
                  <q-avatar size="56px" class="col-auto">
                    <q-icon name="person" />
                  </q-avatar>
                </div>
              </q-card-section>

              <q-separator />

              <q-card-section class="text-caption">
                <!-- <div><strong>Streak:</strong> {{ user?.streak ?? 0 }} days</div>
                <div><strong>Total Sessions:</strong> {{ user?.totalSessions ?? 0 }}</div> -->
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-8">
            <div class="col items-center">
              <div>
                <div class="text-h5 q-mb-sm">Select Topic (Exam)</div>
                <div class="topic-list-container q-py-sm flex flex-center">
                  <div class="column items-center">
                    <q-btn
                      v-for="topic in topicOptions"
                      :key="topic"
                      :label="topic.charAt(0).toUpperCase() + topic.slice(1).toLowerCase()"
                      :color="selectedTopic === topic ? 'primary' : 'grey-3'"
                      :text-color="selectedTopic === topic ? 'white' : 'black'"
                      @click="selectTopic(topic)"
                      class="q-my-xs text-subtitle1"
                      padding="sm md"
                      no-caps
                      unelevated
                    />
                  </div>
                </div>
              </div>

              <div class="q-ml-md justify-end flex" style="width:100%;">
                <q-btn color="primary" label="Start Exam" @click="openInstructions" :disable="!selectedTopic" />
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 q-mb-md">
          <q-btn
            :color="useSampleData ? 'warning' : 'primary'"
            :label="useSampleData ? 'Using Sample Data' : 'Using Real Data'"
            @click="toggleDataSource"
            class="q-mb-sm"
            :icon="useSampleData ? 'model_training' : 'cloud'"
          />
          <div class="text-caption" v-if="useSampleData">
            Currently showing demo data. Toggle to fetch real data from API.
          </div>
        </div>

        <q-separator />

        <!-- Stats summary -->
        <div class="col q-mt-lg q-gutter-md">
          <!-- First card (left side) -->
          <q-card class="row justify-between col-12 col-md-4 q-pa-md">
            <div class="text-h6">Overall Accuracy</div>
            <div class="text-subtitle2 q-mt-sm">{{ stats?.accuracy ?? '—' }}%</div>
          </q-card>

          <q-card class="row justify-between col-12 col-md-5 q-pa-md">
            <div class="text-h6">Avg. Time / Q</div>
            <div class="text-subtitle2 q-mt-sm">{{ stats?.avgTime ?? '—' }}s</div>
          </q-card>

          <q-card class="row justify-between col-12 col-md-5 q-pa-md">
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
    </div>

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
import { ref, onMounted, watch, onBeforeUnmount, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import Chart from 'chart.js/auto';
import type { Chart as ChartJS, ChartTypeRegistry } from 'chart.js';
import { useAuth } from 'src/composables/useAuth';
import { useSession } from 'src/composables/useSession';

const $q = useQuasar();
const router = useRouter();

const { user } = useAuth();
const {
  stats,
  recentSessions,
  topicProgress,
  fetchDashboardForTopic,
  createSession,
  currentSession
} = useSession();

// Topics & selection
const topicOptions = ref<string[]>(['arithmetic', 'algebra', 'diffEq', 'wordProblem']);
const selectedTopic = ref<string>(topicOptions.value[0] || 'arithmetic');

// Chart refs & instances
const accuracyCanvas = ref<HTMLCanvasElement | null>(null);
const timeCanvas = ref<HTMLCanvasElement | null>(null);

let accuracyChart: ChartJS<'line', (number | undefined)[], string> | null = null;
let timeChart: ChartJS<'bar', (number | undefined)[], string> | null = null;

// Dialog
const instructionsOpen = ref(false);
const starting = ref(false);

// Sample data
const SAMPLE_DATA = {
  user: {
    id: 'guest-user',
    fullName: 'Guest User',
    email: 'Try Mental Math - Sign in to save progress',
    age: 0,
    role: 'guest'
  },
  stats: {
    accuracy: 75,
    avgTime: 12.5,
    totalSessions: 5
  },
  recentSessions: [
    {
      id: 'sample-1',
      startTime: new Date(Date.now() - 24*60*60*1000).toISOString(), // yesterday
      topicOrder: ['arithmetic'],
      accuracy: 80,
      duration: 45
    },
    {
      id: 'sample-2',
      startTime: new Date(Date.now() - 48*60*60*1000).toISOString(), // 2 days ago
      topicOrder: ['algebra'],
      accuracy: 70,
      duration: 52
    }
  ],
  topicProgress: {
    arithmetic: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      accuracy: [65, 70, 75, 73, 80],
      avgTime: [15, 14, 12, 13, 11]
    },
    algebra: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      accuracy: [60, 65, 70, 75, 72],
      avgTime: [18, 16, 15, 14, 15]
    },
    diffEq: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      accuracy: [55, 60, 65, 68, 70],
      avgTime: [20, 18, 17, 16, 15]
    },
    wordProblem: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      accuracy: [50, 55, 60, 65, 63],
      avgTime: [25, 22, 20, 19, 18]
    }
  }
};

// helpers
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString();
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
          borderWidth: 2,
          borderColor: '#42A5F5',
          backgroundColor: '#42A5F5',
          pointBackgroundColor: '#42A5F5'
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
          ticks: { 
            stepSize: 10,
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      plugins: {
        legend: { 
          display: false 
        }
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
  
  const labels = topicOptions.value.slice();
  const data = labels.map(t => {
    const entry = topicProgress.value[t];
    if (!entry) return 0;
    const arr = entry.avgTime;
    return arr && arr.length ? arr[arr.length - 1] : 0;
  });

  timeChart = new Chart(timeCanvas.value, {
    type: 'bar',
    data: {
      labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase()),
      datasets: [
        {
          label: 'Avg time (s)',
          data,
          borderWidth: 1,
          backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EC407A'],
          borderColor: ['#42A5F5', '#66BB6A', '#FFA726', '#EC407A']
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.7)'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
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
  if (useSampleData.value) {
    $q.dialog({
      title: 'Sample Mode',
      message: 'This is a demo mode. Toggle to real data to start an actual session.',
      ok: 'Got it'
    });
    return;
  }

  starting.value = true;
  try {
    await createSession([selectedTopic.value]);
    instructionsOpen.value = false;
    if (currentSession.value?.id) {
      await router.push({ name: 'Session', params: { sessionId: currentSession.value.id } });
    }
  } catch (err) {
    console.error(err);
  } finally {
    starting.value = false;
  }
}

function viewSession(id: string) {
  // router.push({ name: 'SessionDetail', params: { id } });
}

// Sample data
const useSampleData = ref(true);

async function toggleDataSource() {
  useSampleData.value = !useSampleData.value;
  if (useSampleData.value) {
    // Load sample data
    stats.value = SAMPLE_DATA.stats;
    recentSessions.value = SAMPLE_DATA.recentSessions;
    topicProgress.value = SAMPLE_DATA.topicProgress;
    user.value = SAMPLE_DATA.user;
  } else {
    // Fetch real data
    try {
      for (const t of topicOptions.value) {
        if (!topicProgress.value[t]) {
          topicProgress.value[t] = { labels: [], accuracy: [], avgTime: [] };
        }
        await fetchDashboardForTopic(t);
      }
    } catch (error) {
      console.error('Error fetching real data:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to fetch real data. Reverting to sample data.',
        position: 'top'
      });
      useSampleData.value = true;
    }
  }
  await refreshAllForTopic(selectedTopic.value);
}

// lifecycle
onMounted(async () => {
  if (useSampleData.value) {
    stats.value = SAMPLE_DATA.stats;
    recentSessions.value = SAMPLE_DATA.recentSessions;
    topicProgress.value = SAMPLE_DATA.topicProgress;
    user.value = SAMPLE_DATA.user;
  } else {
    for (const t of topicOptions.value) {
      if (!topicProgress.value[t]) {
        topicProgress.value[t] = { labels: [], accuracy: [], avgTime: [] };
      }
      await fetchDashboardForTopic(t);
    }
  }
  await refreshAllForTopic(selectedTopic.value);
});

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
.dashboard-page {
  position: relative;
}

.dashboard-content {
  position: relative;
  z-index: 1;
}


/* Update card transparency */
:deep(.q-card) {
  /* background: rgba(255, 255, 255, 0.05) !important; */
  backdrop-filter: blur(8px);
  border: 1px solid rgb(255, 255, 255);
}

/* Optional: Add trargb(255, 255, 255) */
:deep(.q-card) {
  transition: background-color 0.3s ease;
}

:deep(.q-card:hover) {
  /* background: rgba(255, 255, 255, 0.08) !important; */
}

/* Ensure text is readable */
:deep(.text-h6),
:deep(.text-subtitle1),
:deep(.text-subtitle2),
:deep(.text-caption) {
  color: white;
}



.chart-container {
  height: 320px;
  position: relative;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 16px;
}

.chart-container canvas {
  width: 100% !important;
  height: 100% !important;
}

/* Add this new style for chart cards */
:deep(.q-card) .chart-container {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(8px);
}

.topic-list-container .scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
