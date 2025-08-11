<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header -->
    <q-header elevated>
      <q-toolbar>
        <q-btn flat round icon="arrow_back" @click="goBack" />
        <q-toolbar-title>{{ currentQuestion }}/{{ totalQuestions }}</q-toolbar-title>
        
        <q-circular-progress
          class="q-mr-md"
          show-value
          font-size="12px"
          :value="progressPercentage"
          size="50px"
          :thickness="0.2"
          color="accent"
          track-color="grey-3"
        >
          <div class="text-caption">{{ remainingTime }}s</div>
        </q-circular-progress>
        
        <q-btn flat round icon="help_outline">
          <q-tooltip>Help</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Main Content -->
    <q-page-container>
      <router-view 
        @question-answered="handleAnswered"
        @next-question="handleNextQuestion"
        @finish-session="finishSession"
      />
    </q-page-container>

    <!-- Confirm Dialog -->
    <q-dialog v-model="confirmExit" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Exit Session</div>
        </q-card-section>
        <q-card-section>
          Are you sure you want to exit this session? Your progress will be lost.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn flat label="Exit" color="negative" @click="exitSession" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Time Up Modal -->
    <q-dialog v-model="timeUpDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">Time's Up!</div>
        </q-card-section>
        <q-card-section>
          Your time for this question has expired.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Continue" color="primary" @click="handleTimeUp" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, provide } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

// Props and emits
interface Props {
  totalQuestions?: number;
  timePerQuestion?: number;
}

const props = withDefaults(defineProps<Props>(), {
  totalQuestions: 10,
  timePerQuestion: 30,
});

const emit = defineEmits(['session-completed', 'session-abandoned']);

// Router and utilities
const router = useRouter();
const $q = useQuasar();

// State
const currentQuestion = ref(1);
const remainingTime = ref(props.timePerQuestion);
const confirmExit = ref(false);
const timeUpDialog = ref(false);
let timer: number | null = null;

// Computed
const progressPercentage = computed(() => {
  return (currentQuestion.value / props.totalQuestions) * 100;
});

// Methods
function startTimer() {
  remainingTime.value = props.timePerQuestion;
  if (timer) clearInterval(timer);
  
  timer = window.setInterval(() => {
    if (remainingTime.value <= 0) {
      clearInterval(timer as number);
      timeUpDialog.value = true;
      return;
    }
    remainingTime.value--;
  }, 1000);
}

function goBack() {
  confirmExit.value = true;
}

async function exitSession() {
  if (timer) clearInterval(timer);
  emit('session-abandoned');
  await router.push('/dashboard');
}

async function finishSession(results: any) {
  if (timer) clearInterval(timer);
  emit('session-completed', results);
  await router.push({
    name: 'SessionResults',
    params: { results: JSON.stringify(results) }
  });
}

function handleAnswered(correct: boolean) {
  $q.notify({
    type: correct ? 'positive' : 'negative',
    message: correct ? 'Correct!' : 'Incorrect',
    timeout: 1000
  });
  
  if (timer) clearInterval(timer);
}

async function handleNextQuestion() {
  if (currentQuestion.value < props.totalQuestions) {
    currentQuestion.value++;
    startTimer();
  } else {
    // Finished all questions
    await finishSession({ completed: true });
  }
}

async function handleTimeUp() {
  timeUpDialog.value = false;
  // Trigger the same flow as if the user got the question wrong
  handleAnswered(false);
  // Move to next question
  await handleNextQuestion();
}

// Lifecycle hooks
startTimer();

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

// Provide context to child components
provide('questionContext', {
  currentQuestion,
  totalQuestions: props.totalQuestions,
  remainingTime
});
</script>

<style scoped>
.q-toolbar {
  min-height: 64px;
}
</style>