<template>
  <q-page class="q-pa-xl column items-center">
    <div class="row q-col-gutter-md q-mb-xl items-center justify-center landing-bg"
      style="max-width:1200px; width:100%; min-height: 60vh;">
      <div class="col-12 col-md-8 flex flex-center column items-center">
        <div class="mentalmath-logo q-mb-md">MentalMath</div>
        <div class="text-h5 q-mt-sm text-center" style="min-height: 3.5em;">
          {{ displayedText }}
          <span v-if="showCursor" class="typewriter-cursor">|</span>
        </div>
      </div>
    </div>

    <!-- HOW IT WORKS -->
    <div class="how-it-works" style="max-width:1200px; width:100%;">
      <q-card flat bordered class="q-pa-lg q-mb-lg">
        <div class="row">
          <div class="col-12 col-md-4">
            <div class="text-subtitle2 text-weight-medium">How MentalMath Works</div>
            <div class="text-caption q-mt-sm">A guided one-hour session that adapts to you.</div>
          </div>

          <div class="col-12 col-md-8">
            <q-timeline class="q-pa-none">
              <!-- transition-group handles enter/leave animations -->
              <transition-group name="fade-slide" tag="div">
                <q-timeline-entry v-for="(item) in visibleEntries" :key="item.title" :icon="item.icon"
                  :color="item.color" :title="item.title" :subtitle="item.subtitle" class="timeline-entry">
                  <div class="text-body2" v-html="item.body"></div>
                </q-timeline-entry>
              </transition-group>
            </q-timeline>
          </div>
        </div>
      </q-card>
    </div>

    <!-- FEATURES -->
    <div class="features" style="max-width:1200px; width:100%;">
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-12 col-md-3" v-for="feature in features" :key="feature.title">
          <q-card bordered class="q-pa-md">
            <div class="row items-start">
              <q-avatar square class="q-mr-md" color="primary"><q-icon :name="feature.icon" /></q-avatar>
              <div>
                <div class="text-h6">{{ feature.title }}</div>
                <div class="text-caption">{{ feature.description }}</div>
              </div>
            </div>
          </q-card>
        </div>
      </div>
    </div>

    <!-- BENEFITS -->
    <div class="benefits" style="max-width:1200px; width:100%;">
      <q-card flat bordered class="q-pa-lg q-mb-lg">
        <div class="row">
          <div class="col-12 col-md-6">
            <div class="text-h6">Who is this for?</div>
            <ul>
              <li>Students preparing for exams who want speed and confidence</li>
              <li>Adults who avoid math anxiety and want practical mental techniques</li>
              <li>Teachers who want quick, adaptive practice tools for learners</li>
            </ul>
          </div>

          <div class="col-12 col-md-6">
            <div class="text-h6">What you’ll gain</div>
            <ul>
              <li>Concrete mental strategies (chunking, complements, doubling)</li>
              <li>Faster mental calculation and improved problem-solving flow</li>
              <li>Reduced anxiety through scaffolded success and encouragement</li>
            </ul>
          </div>
        </div>
      </q-card>
    </div>

    <!-- FAQ -->
    <div style="max-width:1200px; width:100%;" class="q-mb-lg faq">
      <q-card flat bordered class="q-pa-lg">
        <div class="text-h6 q-mb-md">FAQ</div>
        <q-expansion-item icon="help" label="Is this a chatbot or an intelligent tutor?">
          <div class="text-body2">
            The Agent is an intelligent tutor: it uses deterministic rules for difficulty and strategy selection
            (fast, explainable decisions) and optionally uses a local or hosted LLM to turn responses into
            friendly, natural language. The core learning decisions are rule-based — not blind LLM reasoning.
          </div>
        </q-expansion-item>

        <q-expansion-item icon="security" label="Is my data private?">
          <div class="text-body2">
            For local development you can run everything on your machine (local LLM and agent). In production,
            you control which services run where. Do not share user data with third-party LLMs if you need privacy.
          </div>
        </q-expansion-item>

        <q-expansion-item icon="offline_bolt" label="Can I run the agent locally?">
          <div class="text-body2">
            Yes — the agent supports a local LLM backend (llama.cpp via Python bindings) or a remote LLM server.
            The agent falls back to rule-based tips if no LLM is available.
          </div>
        </q-expansion-item>
      </q-card>
    </div>

    <!-- CTA Footer -->
    <div style="max-width:1200px; width:100%;">
      <q-separator />
      <div class="row items-center q-pt-md">
        <div class="col-12 col-md-8">
          <div class="text-h6">Ready to build your mental math skills?</div>
          <div class="text-caption q-mt-sm">Choose topics and try a guided 1-hour session with the agent coach.</div>
        </div>
        <div class="col-12 col-md-4 text-right">
          <q-btn color="primary" label="Start a Session" @click="startSession" :loading="starting" />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import axios from 'axios';

type Entry = {
  icon: string;
  color: string;
  title: string;
  subtitle: string;
  body: string;
};

const entries = ref<Entry[]>([
  {
    icon: 'lightbulb',
    color: 'primary',
    title: '1. Quick Diagnostic',
    subtitle: '(2–5 mins)',
    body:
      'A rapid quiz to understand which topics you chose and your starting comfort level.'
  },
  {
    icon: 'fitness_center',
    color: 'teal',
    title: '2. Warm-up Drills',
    subtitle: '(5–10 mins)',
    body:
      'Fast number-sense exercises to get your mind working: mental addition, shortcuts, and estimation.'
  },
  {
    icon: 'psychology',
    color: 'amber',
    title: '3. Core Adaptive Practice',
    subtitle: '(40–45 mins)',
    body:
      'The agent serves problems from easiest → hardest for the topics you selected, adjusting difficulty in real time based on correctness and response speed.'
  },
  {
    icon: 'summarize',
    color: 'indigo',
    title: '4. Wrap-Up & Summary',
    subtitle: '(5–10 mins)',
    body:
      'At the session end you get a friendly summary, per-topic stats, and targeted next-step recommendations.'
  }
]);

// visible flags per entry
const visible = ref<boolean[]>(entries.value.map(() => false));

// computed property for visible entries
const visibleEntries = computed(() => {
  return entries.value.filter((_, index) => visible.value[index]);
});

let running = true; // used to stop loop on unmount

// adjustable timings (ms)
const revealDelay = 900; // time between showing each entry
const revealPause = 2200; // pause after all shown
const hideDelay = 900; // time between hiding each entry
const loopPause = 800; // pause before restarting the loop

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runLoop() {
  // loop forever until stopped (onBeforeUnmount sets running = false)
  while (running) {
    // reveal sequentially
    for (let i = 0; i < entries.value.length && running; i++) {
      visible.value[i] = true;
      await wait(revealDelay);
    }
    if (!running) break;
    // pause with all visible
    await wait(revealPause);
    if (!running) break;
    // hide sequentially (same order)
    for (let i = 0; i < entries.value.length && running; i++) {
      visible.value[i] = false;
      await wait(hideDelay);
    }
    if (!running) break;
    // small pause before restarting
    await wait(loopPause);
    // loop repeats
  }
}

onMounted(() => {
  running = true;
  // ensure initial state is all hidden
  visible.value = entries.value.map(() => false);
  void runLoop();
});

onBeforeUnmount(() => {
  running = false;
});

const fullText = ref(
  "Build confidence in mathematics — one adaptive, guided session at a time. " +
  "Learn mental strategies, reduce anxiety, and solve word problems across arithmetic, algebra, and more."
);
const displayedText = ref('');
const showCursor = ref(true);

function typeWriterEffect() {
  let i = 0;
  let deleting = false;

  function type() {
    if (!deleting) {
      if (i < fullText.value.length) {
        displayedText.value += fullText.value.charAt(i);
        i++;
        setTimeout(type, 24); // typing speed
      } else {
        setTimeout(() => {
          deleting = true;
          setTimeout(type, 800); // pause before deleting
        }, 2200); // pause after full sentence
      }
    } else {
      if (i > 0) {
        displayedText.value = displayedText.value.slice(0, -1);
        i--;
        setTimeout(type, 6); // deleting speed (faster)
      } else {
        deleting = false;
        setTimeout(type, 600); // pause before typing again
      }
    }
  }
  type();
}

onMounted(() => {
  typeWriterEffect();
});

interface DemoTopicStat {
  stats: { accuracy: number; avgTime: number };
  chart?: any;
  recent?: any[];
}

interface DemoData {
  [topic: string]: DemoTopicStat;
}

const $q = useQuasar();
const router = useRouter();

const allTopics = ref<string[]>(['Arithmetic', 'Algebra', 'DiffEq', 'WordProblem']);
const selectedTopics = ref<string[]>(['Arithmetic', 'Algebra']);

const demoStats = ref<DemoData | null>(null);

const starting = ref(false);

onMounted(async () => {
  // load demo data if file exists (data.json in public/)
  try {
    const r = await axios.get('/data.json');
    if (r?.data?.dashboard) {
      demoStats.value = r.data.dashboard;
    }
  } catch {
    demoStats.value = null;
  }
});

async function startSession() {
  if (!selectedTopics.value.length) {
    $q.notify({ type: 'warning', message: 'Please pick at least one topic.' });
    return;
  }

  starting.value = true;

  try {
    // call backend to create session
    const payload = {
      userId: null, // if user is anonymous, backend may create a guest session
      topicOrder: selectedTopics.value
    };
    const res = await axios.post('/sessions/start', payload);
    const sid = res?.data?.sessionId;
    if (!sid) throw new Error('no session id');

    $q.notify({ type: 'positive', message: 'Session started — good luck!' });

    // navigate to session view (make sure route exists)
    // router.push({ name: 'Session', params: { sessionId: sid } });
  } catch (err: any) {
    console.error(err);
    $q.notify({ type: 'negative', message: 'Failed to start session. Try again.' });
  } finally {
    starting.value = false;
  }
}

async function tryDemo() {
  // simple demo flow: start with default topics, then go to session
  selectedTopics.value = ['Arithmetic'];
  await startSession();
}

const features = ref([
  {
    icon: 'autorenew',
    title: 'Adaptive Questioning',
    description: 'Real-time difficulty adjustments based on correctness and response time.'
  },
  {
    icon: 'lightbulb',
    title: 'Strategy Tips',
    description: 'Just-in-time mental techniques (chunking, complements, doubling).'
  },
  {
    icon: 'chat',
    title: 'Agent Coach',
    description: 'Friendly guidance, reflection prompts, and encouragement during practice.'
  },
  {
    icon: 'bar_chart',
    title: 'Progress Dashboard',
    description: 'Per-topic analytics with accuracy and speed trends.'
  },
  {
    icon: 'devices',
    title: 'Cross-Platform',
    description: 'PWA + Mobile + Desktop via Quasar, Capacitor, and Electron/Tauri.'
  },
  {
    icon: 'security',
    title: 'Privacy-first',
    description: 'Local LLM support and data controls—keep your work on your machine if you choose.'
  }
]);
</script>

<style scoped>
ul {
  padding-left: 1rem;
  margin: 0.5rem 0;
}
</style>
