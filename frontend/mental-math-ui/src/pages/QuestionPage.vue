<template>
  <q-page padding class="column items-center">
    <!-- Question Display -->
    <q-card class="question-card q-pa-lg q-mb-md">
      <div class="text-h6 q-mb-md">{{ currentQuestion.prompt }}</div>
      
      <div v-if="currentQuestion.type === 'multiple-choice'" class="q-gutter-y-md">
        <q-btn 
          v-for="(option, index) in currentQuestion.options" 
          :key="index"
          :label="option"
          class="full-width text-left"
          :color="showFeedback && selectedAnswer === option ? 
                  (option === currentQuestion.answer ? 'positive' : 'negative') : 
                  'primary'"
          :disable="showFeedback"
          @click="selectAnswer(option)"
        />
      </div>
      
      <div v-else-if="currentQuestion.type === 'numeric'" class="q-gutter-y-md">
        <q-input
          v-model.number="numericAnswer"
          type="number"
          label="Your answer"
          outlined
          :disable="showFeedback"
          @keyup.enter="submitNumericAnswer"
        />
        <q-btn
          label="Submit"
          color="primary"
          class="full-width"
          :disable="showFeedback || numericAnswer === null"
          @click="submitNumericAnswer"
        />
      </div>
    </q-card>
    
    <!-- Feedback Section -->
    <div v-if="showFeedback" class="feedback-section">
      <q-card :class="isCorrect ? 'bg-positive text-white' : 'bg-negative text-white'" class="q-pa-md">
        <div class="text-h6">{{ isCorrect ? 'Correct!' : 'Incorrect' }}</div>
        <div v-if="!isCorrect" class="q-mt-sm">
          Correct answer: {{ currentQuestion.answer }}
        </div>
        <div class="q-mt-md" v-if="currentQuestion.explanation">
          {{ currentQuestion.explanation }}
        </div>
      </q-card>
      
      <q-btn
        label="Next Question"
        color="primary"
        class="q-mt-md full-width"
        @click="nextQuestion"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject, watch } from 'vue';
import { useQuasar } from 'quasar';
import axios from 'axios';

// Types
interface Question {
  id: string;
  type: 'multiple-choice' | 'numeric';
  prompt: string;
  options?: string[];
  answer: string | number;
  explanation?: string;
  difficulty: number;
  topic: string;
}

// Question context interface
interface QuestionContext {
  totalQuestions: number;
  timePerQuestion: number;
  remainingTime: number;
}

// Inject context from parent layout
const questionContext = inject<QuestionContext>('questionContext');

// State
const $q = useQuasar();
const questions = ref<Question[]>([]);
const currentQuestionIndex = ref(0);
const selectedAnswer = ref<string | null>(null);
const numericAnswer = ref<number | null>(null);
const showFeedback = ref(false);
const isCorrect = ref(false);
const sessionResults = ref({
  correct: 0,
  total: 0,
  questions: [] as {
    questionId: string;
    correct: boolean;
    userAnswer: string | number | null;
    timeTaken: number;
  }[]
});

// Get current question
const currentQuestion = computed((): Question => {
  return questions.value[currentQuestionIndex.value] || {
    id: '0',
    type: 'multiple-choice',
    prompt: 'Loading question...',
    options: ['Loading...'],
    answer: '',
    difficulty: 1,
    topic: 'general'
  };
});

// Emit events for parent component
const emit = defineEmits(['question-answered', 'next-question', 'finish-session']);

// Methods
async function fetchQuestions() {
  try {
    // Replace with your actual API endpoint
    const response = await axios.get('/api/questions', {
      params: {
        count: questionContext?.totalQuestions || 10,
        topic: 'all'
      }
    });
    questions.value = response.data;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to load questions'
    });
    
    // Fallback questions for demonstration
    questions.value = [
      {
        id: '1',
        type: 'multiple-choice',
        prompt: 'What is 12 × 8?',
        options: ['86', '96', '106', '116'],
        answer: '96',
        difficulty: 2,
        topic: 'arithmetic'
      },
      {
        id: '2',
        type: 'numeric',
        prompt: 'What is the square root of 144?',
        answer: 12,
        difficulty: 2,
        topic: 'arithmetic'
      },
      {
        id: '3',
        type: 'multiple-choice',
        prompt: 'Solve for x: 3x + 7 = 22',
        options: ['3', '5', '7', '15'],
        answer: '5',
        explanation: 'Subtract 7 from both sides: 3x = 15. Then divide both sides by 3: x = 5.',
        difficulty: 3,
        topic: 'algebra'
      }
    ];
  }
}

function selectAnswer(answer: string) {
  selectedAnswer.value = answer;
  checkAnswer();
}

function submitNumericAnswer() {
  if (numericAnswer.value === null) return;
  checkAnswer();
}

function checkAnswer() {
  const userAnswer = currentQuestion.value.type === 'numeric' ? 
    numericAnswer.value : selectedAnswer.value;
  
  isCorrect.value = userAnswer === currentQuestion.value.answer;
  showFeedback.value = true;
  
  // Record result
  sessionResults.value.total++;
  if (isCorrect.value) {
    sessionResults.value.correct++;
  }
  
  sessionResults.value.questions.push({
    questionId: currentQuestion.value.id,
    correct: isCorrect.value,
    userAnswer,
    timeTaken: (questionContext?.timePerQuestion || 0) - (questionContext?.remainingTime || 0)
  });
  
  emit('question-answered', isCorrect.value);
}

function nextQuestion() {
  selectedAnswer.value = null;
  numericAnswer.value = null;
  showFeedback.value = false;
  
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    emit('next-question');
  } else {
    // Finished all questions
    emit('finish-session', {
      accuracy: Math.round((sessionResults.value.correct / sessionResults.value.total) * 100),
      totalQuestions: sessionResults.value.total,
      correctAnswers: sessionResults.value.correct,
      details: sessionResults.value.questions
    });
  }
}

// Watch for time changes
watch(() => questionContext?.remainingTime, (newVal) => {
  if (newVal === 0 && !showFeedback.value) {
    // Time ran out, mark question as incorrect
    isCorrect.value = false;
    showFeedback.value = true;
    
    sessionResults.value.total++;
    sessionResults.value.questions.push({
      questionId: currentQuestion.value.id,
      correct: false,
      userAnswer: currentQuestion.value.type === 'numeric' ? numericAnswer.value : selectedAnswer.value,
      timeTaken: questionContext?.timePerQuestion || 30
    });
    
    emit('question-answered', false);
  }
}, { immediate: false });

// Lifecycle hooks
onMounted(fetchQuestions);
</script>

<style scoped>
.question-card {
  width: 100%;
  max-width: 600px;
}

.feedback-section {
  width: 100%;
  max-width: 600px;
}

@media (min-width: 600px) {
  .question-card, .feedback-section {
    width: 600px;
  }
}
</style>