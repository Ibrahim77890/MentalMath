import { ref } from 'vue'
import type { Session, CurrentSessionQuestionResponse } from '../apis/session';
import { SessionAPI } from '../apis/session'
import { useAuth } from './useAuth'

const currentSession = ref<Session | null>(null)
const currentQuestion = ref<CurrentSessionQuestionResponse | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useSession() {
  const { token } = useAuth()

  async function createSession(topicOrder: string[]) {
    if (!token.value) return
    loading.value = true
    try {
      const res = await SessionAPI.createSession(topicOrder, token.value)
      if (res.success) {
        currentSession.value = res.data
      } else {
        error.value = res.message || null
      }
    } finally {
      loading.value = false
    }
  }

  async function getLatestSession(sessionId: string) {
    if (!token.value) return
    loading.value = true
    try {
      const res = await SessionAPI.getSession(sessionId, token.value)
      if (res.success) {
        currentSession.value = res.data
        console.log("[getLatestSession] data", res);
      } else {
        error.value = res.message || null
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchLatestQuestion() {
    if (!token.value || !currentSession.value) return
    const res = await SessionAPI.getSessionLatestQuestion(currentSession.value.id, token.value)
    console.log("[fetchLatestQuestion] data", res);
    
    if (res.success) {
      currentQuestion.value = res.data
    }
  }

  async function submitAnswer(response: string, timeTaken: number) {
    if (!token.value || !currentSession.value) return
    const res = await SessionAPI.postSessionLatestQuestionAnswer(
      currentSession.value.id,
      response,
      timeTaken,
      token.value
    )
    if (res.success) {
      currentQuestion.value = res.data
    }
  }

  const stats = ref<any>(null);
  const recentSessions = ref<any[]>([]);
  const topicProgress = ref<Record<string, any>>({});

  async function fetchDashboardForTopic(topic: string) {
    if (!token.value) return;
    loading.value = true;
    try {
      const res = await SessionAPI.fetchDashboardForTopic(topic, token.value);
      if (res.success) {
        stats.value = res.data.stats;
        recentSessions.value = res.data.recent ?? [];
        topicProgress.value[topic] = {
          labels: res.data.chart.labels ?? [],
          accuracy: res.data.chart.accuracyData ?? [],
          avgTime: res.data.chart.timeData ?? []
        };
      }
    } finally {
      loading.value = false;
    }
  }

  return { currentSession, currentQuestion, loading, error, createSession, fetchLatestQuestion, submitAnswer, fetchDashboardForTopic, stats, recentSessions, topicProgress, getLatestSession }
}
