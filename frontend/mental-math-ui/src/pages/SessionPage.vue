<template>
  <q-page class="q-pa-md">
    <!-- Add End Session Button -->
    <div class="text-right q-mb-md" v-if="!sessionEnded">
      <q-btn 
        color="negative" 
        label="End Session" 
        @click="confirmEndSession"
      />
    </div>

    <!-- Session Content -->
    <div v-if="!sessionEnded">
      <div class="row justify-around" style="height: 100%;">
        <!-- Left: Question area -->
        <div class="col-12 col-lg-5"  style="border: 2px solid white; height: 80vh; display: flex; flex-direction: column; margin-right: 8px;">
          <q-card flat bordered class="q-pa-lg">
            <div class="row items-center q-mb-md">
              <div class="col">
                <div class="text-subtitle2">
                  Topic: <strong>{{ currentQuestionData?.topic ?? sessionTopic }}</strong>
                </div>
                <div class="text-caption">
                  Question {{ currentIndex + 1 }} / {{ questionCountEstimate }}
                </div>
              </div>
              <div class="col-auto text-right">
                <div class="text-caption">Question timer</div>
                <div class="text-h6 text-weight-bold">{{ formattedQTimer }}</div>
              </div>
            </div>

            <q-separator />

            <div class="q-pa-md">
              <div v-if="loading" class="text-center q-pa-md">
                <q-spinner-dots size="48" />
              </div>

              <div v-else-if="currentQuestionData">
                <div class="text-h6 q-mb-md" v-html="currentQuestionData.text"></div>

                <div v-if="currentQuestionData.options && currentQuestionData.options.length">
                  <q-option-group
                    v-model="selectedOption"
                    :options="currentQuestionData.options"
                    type="radio"
                    dense
                  />
                </div>
                <div v-else>
                  <q-input
                    v-model="freeAnswer"
                    label="Type your answer"
                    outlined
                    lazy-rules
                    autofocus
                  />
                </div>

                <div class="row q-mt-md items-center">
                  <q-btn color="primary" label="Submit" @click="submitAnswerHandler" />
                  <!-- Add skip/hint/favorite as needed -->
                  <q-space />
                  <div class="text-caption">
                    Est. time: {{ currentQuestionData.estimatedTime ?? '—' }}s
                  </div>
                </div>

                <div v-if="lastAgentMessage" class="q-mt-md">
                  <q-banner dense rounded class="bg-grey-1">
                    <div><strong>Agent:</strong> {{ lastAgentMessage.message }}</div>
                    <div v-if="lastAgentMessage.strategyTip" class="text-caption q-mt-xs">
                      <strong>Tip:</strong> {{ lastAgentMessage.strategyTip }}
                    </div>
                  </q-banner>
                </div>
              </div>

              <div v-else class="text-center q-pa-md">
                <div class="text-subtitle1">No question available</div>
                <div class="text-caption q-mt-sm">Try changing topics or finish the session.</div>
              </div>
            </div>
          </q-card>

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
        <div class="col-12 col-lg-5" style="border: 2px solid white; height: 80vh; display: flex; margin-left: 8px;">
          <q-card flat bordered class="q-pa-md">
            <div style="font-size: 32px;">Session</div>
            <div class="q-mt-sm" style="font-size: 16px;">Session ID: {{ sessionId }}</div>
            <div style="font-size: 16px;">Started: {{ sessionStartedAt }}</div>
            <div class=" q-mt-sm" style="font-size: 16px;"><strong>Session remaining:</strong> {{ formattedSessionTimer }}</div>

            <q-separator class="q-mt-md q-mb-md" />

            <q-card 
              v-if="currentQuestion?.previousQuestionAgenticPromptReflection" 
              class="q-mb-md agent-feedback-card"
            >
              <q-card-section>
                <div class="text-h6">Agent Feedback</div>
                <div 
                  v-if="currentQuestion.previousQuestionAgenticPromptReflection.trace?.llm_response" 
                  class="text-body1 q-mb-sm"
                >
                  {{ currentQuestion.previousQuestionAgenticPromptReflection.trace.llm_response }}
                </div>
                <div class="text-caption q-mt-sm">
                  <q-chip 
                    :color="currentQuestion.previousQuestionAgenticPromptReflection.reason === 'remedial' ? 'warning' : 'positive'"
                    text-color="white"
                    size="sm"
                  >
                    {{ currentQuestion.previousQuestionAgenticPromptReflection.reason }}
                  </q-chip>
                  <q-chip color="primary" text-color="white" size="sm">
                    Mastery: {{ (currentQuestion.previousQuestionAgenticPromptReflection.trace.mastery * 100).toFixed(1) }}%
                  </q-chip>
                </div>
              </q-card-section>
            </q-card>

            <div class="q-mt-md">
              <!-- <q-btn color="negative" label="End Session" @click="endSession" /> -->
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Session End Summary -->
    <div v-else class="session-summary">
      <!-- Hero KPI Card -->
      <q-card class="q-mb-lg summary-hero">
        <q-card-section>
          <div class="text-h4 q-mb-md">Session Complete!</div>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-3" v-for="(value, key) in summary.kpis" :key="key">
              <div class="text-h3">{{ formatKPI(key.toString(), value) }}</div>
              <div class="text-caption">{{ formatKPILabel(key.toString()) }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Agent Narrative -->
      <q-card class="q-mb-lg agent-narrative">
        <q-card-section>
          <div class="text-h5 q-mb-md">Session Analysis</div>
          <p>{{ summary.agent.summaryText }}</p>
          <p class="text-weight-bold">{{ summary.agent.nextStepsText }}</p>
          <q-list v-if="summary.agent.highlights">
            <q-item v-for="highlight in summary.agent.highlights" :key="highlight">
              <q-item-section avatar>
                <q-icon name="star" color="yellow" />
              </q-item-section>
              <q-item-section>{{ highlight }}</q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Topics Summary -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="text-h5 q-mb-md">Topic Performance</div>
          <q-tabs
            v-model="activeTopicTab"
            class="text-grey"
            active-color="primary"
            indicator-color="primary"
            align="justify"
          >
            <q-tab 
              v-for="topic in summary.topics" 
              :key="topic.topic"
              :name="topic.topic"
              :label="topic.topic"
            />
          </q-tabs>

          <q-tab-panels v-model="activeTopicTab" animated>
            <q-tab-panel 
              v-for="topic in summary.topics" 
              :key="topic.topic"
              :name="topic.topic"
            >
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <div class="text-h6">Accuracy: {{ topic.accuracyPct }}%</div>
                  <div class="text-subtitle2">
                    {{ topic.correct }}/{{ topic.attempted }} correct
                  </div>
                  <div v-if="topic.deltas?.accuracyPctDelta" class="text-positive">
                    {{ topic.deltas.accuracyPctDelta > 0 ? '+' : '' }}{{ topic.deltas.accuracyPctDelta }}% vs last session
                  </div>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card-section>
      </q-card>

      <!-- Next Steps CTA -->
      <q-card v-if="summary.nextPlan" class="q-mb-lg bg-primary text-white">
        <q-card-section>
          <div class="text-h5">Ready for your next challenge?</div>
          <p>{{ summary.nextPlan.reason }}</p>
          <q-btn 
            color="white" 
            text-color="primary"
            :label="`Start ${summary.nextPlan.suggestedDurationMin}-min ${summary.nextPlan.recommendedTopic} Session`"
            @click="startNextSession"
          />
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useSession } from 'src/composables/useSession';
import { formatTime } from 'src/utils/time'; // Create this utility
import { SAMPLE_END_SESSION } from '../data/sampleSessionEnd';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const { currentSession, currentQuestion, loading, submitAnswer, fetchLatestQuestion, getLatestSession } = useSession();

const sessionId = route.params.sessionId as string;

// Timer variables
const questionTimer = ref(0); // seconds
const sessionTimer = ref(3600); // 1 hour in seconds
const questionStartTime = ref(Date.now());
const timerInterval = ref<number | null>(null);

// Computed properties for formatted times
const formattedQTimer = computed(() => formatTime(questionTimer.value));
const formattedSessionTimer = computed(() => formatTime(sessionTimer.value));

// Add this computed property
const remainingSessionTime = computed(() => {
  if (!currentSession.value?.startTime) return 3600;
  const startTime = new Date(currentSession.value.startTime).getTime();
  const now = Date.now();
  const elapsed = Math.floor((now - startTime) / 1000);
  return Math.max(3600 - elapsed, 0); // 1 hour minus elapsed time
});

// Fetch session and question on mount
onMounted(async () => {
  await getLatestSession(sessionId);
  await fetchLatestQuestion();
  startTimers();
});

// Watch for sessionId changes (if you allow navigation between sessions)
watch(() => route.params.sessionId, async (newId) => {
  if (newId) {
    await getLatestSession(newId as string);
    await fetchLatestQuestion();
  }
});

// Question/Session fields
const sessionTopic = computed(() => currentSession.value?.topicOrder?.[0] ?? '-');
const sessionStartedAt = computed(() => currentSession.value?.startTime ?? '-');
const questionCountEstimate = computed(() => currentSession.value?.questions?.length ?? 1);

const currentIndex = ref(0); // You can update this as user progresses
const currentQuestionData = computed(() => {
  // Use currentQuestion if available, else fallback to first question in session
  return currentQuestion.value?.currentQuestion ?? currentSession.value?.questions?.[currentIndex.value]?.question ?? null;
});
const currentQuestionSession = computed(() => {
  return currentSession.value?.questions?.[currentIndex.value] ?? null;
});

const answeredCount = computed(() => {
  return currentSession.value?.questions?.filter(q => q.response && q.response !== '').length ?? 0;
});
const progressFraction = computed(() => {
  const total = currentSession.value?.questions?.length ?? 1;
  return total ? answeredCount.value / total : 0;
});

// Timer control functions
function startTimers() {
  questionStartTime.value = Date.now();
  sessionTimer.value = remainingSessionTime.value;
  
  timerInterval.value = window.setInterval(() => {
    questionTimer.value = Math.floor((Date.now() - questionStartTime.value) / 1000);
    
    if (sessionTimer.value > 0) {
      sessionTimer.value--;
    } else {
      clearInterval(timerInterval.value!);
      $q.dialog({
        title: 'Session Ended',
        message: 'Your session time has expired.',
        persistent: true
      }).onOk(() => {
        // Navigate to results or dashboard
        void router.push('/dashboard');
      });
    }
  }, 1000);
}

function resetQuestionTimer() {
  questionTimer.value = 0;
  questionStartTime.value = Date.now();
}

// Clean up on component unmount
onBeforeUnmount(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
});

// Define type for agent messages
interface AgentMessage {
  type: string;
  message: string;
  strategyTip?: string;
}

// Agent messages (if you want to show feedback/tips)
const agentMessages = ref<AgentMessage[]>([]);
const lastAgentMessage = computed(() => agentMessages.value[0] || null);

// Answer input
const selectedOption = ref<string | null>(null);
const freeAnswer = ref<string>('');

// Submit answer logic
async function submitAnswerHandler() {
  const answerText = currentQuestionData.value?.options?.length
    ? selectedOption.value
    : freeAnswer.value.trim();
  
  // Calculate time taken for this question
  const timeTaken = Math.floor((Date.now() - questionStartTime.value) / 1000);
  
  await submitAnswer(answerText ?? '', timeTaken);
  await fetchLatestQuestion();
  
  // Reset for next question
  selectedOption.value = null;
  freeAnswer.value = '';
  resetQuestionTimer();
}

// Session end logic
const sessionEnded = ref(false);
const summary = ref(SAMPLE_END_SESSION);
const activeTopicTab = ref(summary.value.topics[0]?.topic);

function confirmEndSession() {
  $q.dialog({
    title: 'End Session',
    message: 'Are you sure you want to end this session?',
    ok: {
      label: 'Yes, end session',
      color: 'negative',
      flat: true
    },
    cancel: {
      label: 'Cancel',
      color: 'primary',
      flat: true
    },
    persistent: true,
    class: 'bg-dark text-white'
  }).onOk(() => {
    try {
      // Here you would call your API to end the session
      // For now, just show the summary
      sessionEnded.value = true;
    } catch (error) {
      console.error('Error ending session:', error);
      $q.notify({
        type: 'negative',
        message: 'Failed to end session'
      });
    }
  });
}

function formatKPI(key: string, value: number): string {
  switch(key) {
    case 'accuracyPct':
      return `${value}%`;
    case 'avgTimePerQuestionSec':
      return `${value}s`;
    default:
      return value.toString();
  }
}

function formatKPILabel(key: string): string {
  const labels: Record<string, string> = {
    totalQuestions: 'Total Questions',
    attempted: 'Attempted',
    correct: 'Correct',
    accuracyPct: 'Accuracy',
    avgTimePerQuestionSec: 'Avg Time/Question',
    streakBest: 'Best Streak',
    hintsUsed: 'Hints Used'
  };
  return labels[key] || key;
}

function startNextSession() {
  // Here you would start a new session with the recommended settings
  void router.push('/dashboard');
}
</script>

<style scoped>
.topic-list { display:flex; gap: 8px; }
.chart-container { height: 280px; }
.agent-feedback-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.agent-feedback-card :deep(.q-chip) {
  margin-right: 8px;
}

.session-summary {
  max-width: 1200px;
  margin: 0 auto;
}

.summary-hero {
  background: linear-gradient(135deg, #42A5F5 0%, #2196F3 100%);
  color: white;
}

.agent-narrative {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}
</style>
