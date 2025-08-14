<!-- <template>
  <q-page class="q-pa-md">
    <div class="row">
      <!-- Left: Question area -->
      <div class="col-12 col-lg-8">
        <q-card flat bordered class="q-pa-lg">
          <div class="row items-center q-mb-md">
            <div class="col">
              <div class="text-subtitle2">Topic: <strong>{{ currentQuestion?.topic ?? sessionTopic ?? '-' }}</strong></div>
              <div class="text-caption">Question {{ currentIndex + 1 }} / {{ questionCountEstimate }} </div>
            </div>

            <div class="col-auto text-right">
              <div class="text-caption">Question timer</div>
              <div class="text-h6 text-weight-bold">{{ formattedQTimer }}</div>
            </div>
          </div>

          <q-separator />

          <div class="q-pa-md">
            <div v-if="loadingQuestion" class="text-center q-pa-md">
              <q-spinner-dots size="48" />
            </div>

            <div v-else-if="currentQuestion">
              <!-- Question text -->
              <div class="text-h6 q-mb-md" v-html="currentQuestion.text"></div>

              <!-- MCQ -->
              <div v-if="currentQuestion.options && currentQuestion.options.length">
                <q-option-group
                  v-model="selectedOption"
                  :options="currentQuestion.options"
                  type="radio"
                  dense
                />
              </div>

              <!-- Free text answer -->
              <div v-else>
                <q-input
                  v-model="freeAnswer"
                  label="Type your answer"
                  outlined
                  lazy-rules
                  autofocus
                />
              </div>

              <!-- Controls -->
              <div class="row q-mt-md items-center">
                <q-btn color="primary" label="Submit" @click="submitAnswer" :loading="submitting" />
                <q-btn flat label="Skip" class="q-ml-sm" @click="skipQuestion" />
                <q-btn flat icon="favorite_border" class="q-ml-sm" @click="toggleFavorite" :color="favorite ? 'red' : ''" />
                <q-btn flat label="Hint" class="q-ml-sm" @click="requestHint" />
                <q-space />
                <div class="text-caption">Est. time: {{ currentQuestion.estimatedTime ?? '—' }}s</div>
              </div>

              <!-- agent feedback (immediate) -->
              <div v-if="lastAgentMessage" class="q-mt-md">
                <q-banner dense rounded class="bg-grey-1">
                  <div><strong>Agent:</strong> {{ lastAgentMessage.message }}</div>
                  <div v-if="lastAgentMessage.strategyTip" class="text-caption q-mt-xs"><strong>Tip:</strong> {{ lastAgentMessage.strategyTip }}</div>
                </q-banner>
              </div>
            </div>

            <div v-else class="text-center q-pa-md">
              <div class="text-subtitle1">No question available</div>
              <div class="text-caption q-mt-sm">Try changing topics or finish the session.</div>
            </div>
          </div>
        </q-card>

        <!-- Progress / quick stats -->
        <div class="q-mt-md">
          <q-card flat bordered class="q-pa-md">
            <div class="row items-center">
              <div class="col">
                <div class="text-caption">Progress</div>
                <q-linear-progress :value="progressFraction" color="primary" />
              </div>
              <div class="col-auto text-caption">{{ answeredCount }} answered</div>
            </div>
          </q-card>
        </div>
      </div>

      <!-- Right: Agent panel + session meta -->
      <div class="col-12 col-lg-4">
        <q-card flat bordered class="q-pa-md">
          <div class="text-h6">Session</div>
          <div class="text-caption q-mt-sm">Session ID: {{ sessionId }}</div>
          <div class="text-caption">Started: {{ formatDate(sessionStartedAt) }}</div>
          <div class="text-caption q-mt-sm"><strong>Session remaining:</strong> {{ formattedSessionTimer }}</div>

          <q-separator class="q-mt-md q-mb-md" />

          <div>
            <div class="text-subtitle2">Agent Feed</div>
            <div v-if="agentMessages.length === 0" class="text-caption q-mt-sm">No messages yet</div>
            <div v-for="(m, i) in agentMessages" :key="i" class="q-mt-sm">
              <div class="text-subtitle2">{{ m.type === 'hint' ? 'Hint' : 'Note' }}</div>
              <div class="text-caption">{{ m.message }}</div>
              <div v-if="m.strategyTip" class="text-caption q-mt-xs"><strong>Tip:</strong> {{ m.strategyTip }}</div>
              <q-separator spaced />
            </div>
          </div>

          <div class="q-mt-md">
            <q-btn color="negative" label="End Session" @click="endSession" />
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
/**
 * SessionPage.vue
 *
 * Responsibilities:
 *  - fetch question (from backend /questions/next or from demo data.json)
 *  - show question UI (MCQ or free input)
 *  - handle per-question timer and overall session timer
 *  - on submit, call POST /answers (backend should persist and call agent)
 *  - display agent response (message, tip, reflection) in the agent panel and banner
 *
 * Notes:
 *  - This is a POC-oriented page: endpoints used:
 *     - GET /sessions/:sessionId  (optional - to fetch session meta)
 *     - GET /questions/next?sessionId=... or ?topic=...&difficulty=...
 *     - GET /questions/:id
 *     - POST /answers  (body: {sessionId, questionId, topic, difficulty, wasCorrect, timeTaken, answer, estimatedTime})
 *     - POST /sessions/end
 *  - If your backend differs slightly, adapt the route names accordingly.
 */

import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useQuasar } from 'quasar';

interface Question {
  id: string;
  text: string;
  topic: string;
  difficulty: number;
  options?: { label: string; value: string }[]; // MCQ
  correctAnswer?: string; // may exist for client-side quick check
  estimatedTime?: number; // seconds
}

interface AgentMessage {
  type: string; // 'hint'|'encouragement'|'note'
  message: string;
  strategyTip?: string;
  timestamp: string;
}

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

// Session query param / route param
const sessionId = (route.params.sessionId as string) || (route.query.sessionId as string) || '';
const sessionTopic = (route.params.topic as string) || '';
const sessionStartedAt = ref<string>(new Date().toISOString());
const questionCountEstimate = ref<number>(60);

// current question state
const loadingQuestion = ref<boolean>(true);
const currentQuestion = ref<Question | null>(null);
const currentIndex = ref<number>(0);

const questionTimerDefault = 60; // default per question seconds if not provided
const qTimer = ref<number>(questionTimerDefault);
let qTimerInterval: number | undefined;

// overall session timer
const sessionTotalSeconds = 60 * 60; // 1 hour
const sessionRemainingSeconds = ref<number>(sessionTotalSeconds);
let sessionInterval: number | undefined;

// answer controls
const selectedOption = ref<string | null>(null);
const freeAnswer = ref<string>('');
const submitting = ref(false);
const loadingNext = ref(false);

// favorites / progress
const favorite = ref(false);
const agentMessages = ref<AgentMessage[]>([]);
const lastAgentMessage = ref<AgentMessage | null>(null);

const answeredCount = ref<number>(0);
const progressFraction = computed(() => {
  return Math.min(1, answeredCount.value / (questionCountEstimate.value || 1));
});

// Helper: format date
function formatDate(iso?: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}

// Persist agent messages to sessionStorage for SessionLayout drawer
function pushAgentMessage(msg: AgentMessage) {
  agentMessages.value.unshift(msg);
  lastAgentMessage.value = msg;

  // store in sessionStorage so layout can show them
  const prev = JSON.parse(sessionStorage.getItem('agentMessages') || '[]');
  prev.unshift(msg);
  sessionStorage.setItem('agentMessages', JSON.stringify(prev.slice(0, 50))); // cap 50
}

// Utility - load demo fallback question from data.json
async function loadDemoQuestion(topic: string, difficulty = 1): Promise<Question> {
  const r = await axios.get('/data.json');
  const q = r?.data?.questions?.[0];
  return {
    id: q?.id ?? `demo-${Date.now()}`,
    text: q?.text ?? '2 + 2 = ?',
    topic: q?.topic ?? topic,
    difficulty,
    correctAnswer: q?.correctAnswer ?? '4',
    estimatedTime: q?.estimatedTime ?? 30,
    options: q?.options ?? []
  };
}

// fetch question - try next by session; fallback to topic/difficulty
async function fetchNextQuestion(criteria?: { questionId?: string; topic?: string; difficulty?: number }) {
  loadingQuestion.value = true;
  try {
    let qdata: any = null;

    if (criteria?.questionId) {
      const res = await axios.get(`/questions/${encodeURIComponent(criteria.questionId)}`);
      qdata = res.data;
    } else if (sessionId) {
      // preferred: ask backend for next question in session context
      try {
        const res = await axios.get(`/questions/next?sessionId=${encodeURIComponent(sessionId)}`);
        qdata = res.data;
      } catch {
        // fallback to topic-based
        if (criteria?.topic) {
          const res2 = await axios.get(`/questions/next?topic=${encodeURIComponent(criteria.topic)}&difficulty=${criteria.difficulty ?? 1}`);
          qdata = res2.data;
        } else if (sessionTopic) {
          const res3 = await axios.get(`/questions/next?topic=${encodeURIComponent(sessionTopic)}&difficulty=1`);
          qdata = res3.data;
        } else {
          // final fallback to demo file
          qdata = await loadDemoQuestion(criteria?.topic ?? 'Arithmetic', criteria?.difficulty ?? 1);
        }
      }
    } else {
      // no sessionId: fallback to topic or demo
      if (criteria?.topic) {
        const res = await axios.get(`/questions/next?topic=${encodeURIComponent(criteria.topic)}&difficulty=${criteria.difficulty ?? 1}`);
        qdata = res.data;
      } else {
        qdata = await loadDemoQuestion('Arithmetic', 1);
      }
    }

    // normalize question shape
    const q: Question = {
      id: qdata.id ?? qdata._id ?? `q-${Math.random().toString(36).slice(2, 9)}`,
      text: qdata.text ?? qdata.prompt ?? 'No question text',
      topic: qdata.topic ?? qdata.subject ?? (criteria?.topic ?? 'Arithmetic'),
      difficulty: qdata.difficulty ?? qdata.level ?? 1,
      options: qdata.options ?? (Array.isArray(qdata.choices) ? qdata.choices.map((c: any) => ({ label: c, value: String(c) })) : []),
      correctAnswer: qdata.correctAnswer ?? qdata.answer ?? undefined,
      estimatedTime: qdata.estimatedTime ?? 30
    };

    currentQuestion.value = q;
    qTimer.value = q.estimatedTime ?? questionTimerDefault;
    void startQTimer();

  } catch (err) {
    console.error('fetchNextQuestion error', err);
    // try demo fallback
    try {
      const q = await loadDemoQuestion(criteria?.topic ?? sessionTopic ?? 'Arithmetic', criteria?.difficulty ?? 1);
      currentQuestion.value = q;
      qTimer.value = q.estimatedTime ?? questionTimerDefault;
      void startQTimer();
    } catch (e) {
      currentQuestion.value = null;
    }
  } finally {
    loadingQuestion.value = false;
  }
}

// timers
function startQTimer() {
  stopQTimer();
  qTimerInterval = window.setInterval(() => {
    if (qTimer.value > 0) {
      qTimer.value -= 1;
    } else {
      stopQTimer();
      void submitAnswer(true); // timedOut = true
    }
  }, 1000);
}

function stopQTimer() {
  if (qTimerInterval) {
    clearInterval(qTimerInterval);
    qTimerInterval = undefined;
  }
}

function startSessionTimer() {
  // try to read remaining seconds from sessionStorage (persisted)
  const key = 'sessionRemainingSeconds';
  const prev = parseInt(sessionStorage.getItem(key) || '', 10);
  sessionRemainingSeconds.value = isNaN(prev) ? sessionTotalSeconds : prev;
  // write back to sessionStorage for layout
  sessionStorage.setItem(key, String(sessionRemainingSeconds.value));

  sessionInterval = window.setInterval(() => {
    if (sessionRemainingSeconds.value > 0) {
      sessionRemainingSeconds.value -= 1;
      sessionStorage.setItem(key, String(sessionRemainingSeconds.value));
    } else {
      clearInterval(sessionInterval);
      // end session automatically
      void endSession();
    }
  }, 1000);
}

function stopSessionTimer() {
  if (sessionInterval) {
    clearInterval(sessionInterval);
    sessionInterval = undefined;
  }
}

// formatted displays
const formattedQTimer = computed(() => {
  const s = qTimer.value;
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
});
const formattedSessionTimer = computed(() => {
  const s = sessionRemainingSeconds.value;
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
});

// actions
async function submitAnswer(timedOutOrEvent: boolean | Event = false) {
  // Handle both cases: when called with a boolean (from timer) or with an Event (from click)
  const timedOut = typeof timedOutOrEvent === 'boolean' ? timedOutOrEvent : false;
  
  if (!currentQuestion.value) return;
  submitting.value = true;
  stopQTimer();

  // prepare answer payload
  const answerText = currentQuestion.value.options && currentQuestion.value.options.length
    ? selectedOption.value
    : freeAnswer.value.trim();

  // naive correctness check client-side if correctAnswer present
  let wasCorrect: boolean | null = null;
  if (currentQuestion.value.correctAnswer !== undefined) {
    // compare loosely
    wasCorrect = String(answerText).trim().toLowerCase() === String(currentQuestion.value.correctAnswer).trim().toLowerCase();
  }

  const payload = {
    sessionId: sessionId || null,
    questionId: currentQuestion.value.id,
    topic: currentQuestion.value.topic,
    difficulty: currentQuestion.value.difficulty,
    answer: answerText,
    wasCorrect,
    timeTaken: (currentQuestion.value.estimatedTime ?? questionTimerDefault) - qTimer.value,
    estimatedTime: currentQuestion.value.estimatedTime ?? questionTimerDefault,
    timedOut: !!timedOut
  };

  try {
    // POST to backend which should persist answer and call agent
    const res = await axios.post('/answers', payload);
    // expected: { agent: { nextQuestionId, nextDifficulty, strategyTip, message, reflectionPrompt }, saved: {...} }
    const agent = res?.data?.agent;
    if (agent) {
      const msg = {
        type: agent.strategyTip ? 'hint' : 'note',
        message: agent.message ?? 'Keep going!',
        strategyTip: agent.strategyTip ?? undefined,
        timestamp: new Date().toISOString()
      } as AgentMessage;
      pushAgentMessage(msg);
      // if agent returned nextQuestionId -> fetch it; else if returned nextDifficulty -> request by topic/difficulty
      const nextQuestionId = agent.nextQuestionId ?? null;
      if (nextQuestionId) {
        answeredCount.value += 1;
        await fetchNextQuestion({ questionId: nextQuestionId });
      } else if (agent.nextDifficulty !== undefined) {
        answeredCount.value += 1;
        await fetchNextQuestion({ topic: currentQuestion.value.topic, difficulty: agent.nextDifficulty });
      } else {
        // fallback: fetch by same topic and same difficulty
        answeredCount.value += 1;
        await fetchNextQuestion({ topic: currentQuestion.value.topic, difficulty: currentQuestion.value.difficulty });
      }
    } else {
      // no agent returned — just fetch a next question by same topic
      answeredCount.value += 1;
      await fetchNextQuestion({ topic: currentQuestion.value.topic, difficulty: currentQuestion.value.difficulty });
    }

    // reset answer UI
    selectedOption.value = null;
    freeAnswer.value = '';
    favorite.value = false;
  } catch (err) {
    console.error('submitAnswer error', err);
    $q.notify({ type: 'negative', message: 'Failed to submit answer. Try again.' });
    // try to continue by fetching next question anyway
    await fetchNextQuestion({ topic: currentQuestion.value.topic, difficulty: currentQuestion.value.difficulty });
  } finally {
    submitting.value = false;
  }
}

async function skipQuestion() {
  if (!currentQuestion.value) return;
  stopQTimer();
  // ask server for another question (skip strategy - just request next)
  await fetchNextQuestion({ topic: currentQuestion.value.topic, difficulty: currentQuestion.value.difficulty });
}

function toggleFavorite() {
  favorite.value = !favorite.value;
  $q.notify({ type: favorite.value ? 'positive' : 'info', message: favorite.value ? 'Added to favorites' : 'Removed from favorites' });
}

// Request a hint from agent without submitting an answer
async function requestHint() {
  if (!currentQuestion.value) return;
  try {
    // call an agent hint endpoint (backend should proxy to agent / or implement hint route)
    const res = await axios.post('/agent/hint', {
      sessionId: sessionId || null,
      questionId: currentQuestion.value.id,
      topic: currentQuestion.value.topic,
      difficulty: currentQuestion.value.difficulty
    });
    const agent = res?.data;
    if (agent) {
      const msg: AgentMessage = {
        type: 'hint',
        message: agent.message ?? 'Try breaking the problem down.',
        strategyTip: agent.strategyTip ?? undefined,
        timestamp: new Date().toISOString()
      };
      pushAgentMessage(msg);
    } else {
      $q.notify({ type: 'info', message: 'No hint available' });
    }
  } catch (e) {
    console.error(e);
    $q.notify({ type: 'negative', message: 'Failed to fetch hint' });
  }
}

// End session
async function endSession() {
  stopQTimer();
  stopSessionTimer();
  try {
    await axios.post('/sessions/end', { sessionId });
    $q.notify({ type: 'positive', message: 'Session ended' });
  } catch (e) {
    console.warn('endSession failed', e);
    $q.notify({ type: 'info', message: 'Session ended locally (offline)' });
  } finally {
    // clear stored agent messages
    sessionStorage.removeItem('agentMessages');
    // route to summary or dashboard
    // router.push({ name: 'Dashboard' });
  }
}

onMounted(async () => {
  // session start timestamp
  sessionStartedAt.value = new Date().toISOString();

  // start overall session timer
  startSessionTimer();

  // fetch first question (prefer by session context; else by provided topic)
  await fetchNextQuestion({ topic: sessionTopic || 'Arithmetic', difficulty: 1 });
});

onBeforeUnmount(() => {
  stopQTimer();
  stopSessionTimer();
});
</script>

<style scoped>
.topic-list { display:flex; gap: 8px; }
.chart-container { height: 280px; }
</style> -->
