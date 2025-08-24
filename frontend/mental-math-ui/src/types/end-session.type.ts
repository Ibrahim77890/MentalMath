// types/end-session.ts

export type TopicSlug =
  | 'Arithmetic'
  | 'Algebra'
  | 'DifferentialEquations'
  | 'WordProblem';

export type QuestionType = 'mcq' | 'numeric' | 'free_text' | 'true_false';

export interface EndSessionSummary {
  sessionId: string;
  userId: string | null;              // null for guest
  startedAt: string;                  // ISO
  endedAt: string;                    // ISO
  durationSec: number;

  // High-level KPIs shown at the top hero card
  kpis: {
    totalQuestions: number;
    attempted: number;
    correct: number;
    accuracyPct: number;              // (correct/attempted)*100
    avgTimePerQuestionSec: number;
    streakBest: number;
    hintsUsed: number;
  };

  // Per-topic breakdown (cards or tabs)
  topics: TopicSummary[];

  // Agent narrative + recommendations (right rail or below fold)
  agent: AgentNarrative;

  // Items the user can review (expand to see solution/explanation)
  review: QuestionReviewItem[];

  // Optional visual data for charts
  charts?: {
    accuracyOverTime?: ChartPoint[];          // index or timestamp on x
    timePerQuestionOverTime?: ChartPoint[];   // seconds on y
    difficultyProgression?: ChartPoint[];     // 1..5 on y
  };

  // Badges, milestones, gamification (optional)
  achievements?: Badge[];

  // Next suggested practice plan (CTA)
  nextPlan?: NextPracticePlan;
}

export interface TopicSummary {
  topic: TopicSlug;
  subtopicsCovered: string[];         // e.g., ['Estimation','Two-digit addition']
  attempted: number;
  correct: number;
  accuracyPct: number;
  avgTimePerQuestionSec: number;

  // Skill-level lens (matches your mentalSkill tags)
  skills: SkillStat[];

  // Mastery deltas vs. previous session(s)
  deltas?: {
    accuracyPctDelta?: number;        // +10.5 means improved
    timePerQuestionDeltaSec?: number; // negative is faster
    difficultyDelta?: number;         // +0.6 average difficulty increase
  };

  // Top tips user received in this topic (distinct & concise)
  strategyTipsShown?: string[];
}

export interface SkillStat {
  skill: string;                      // e.g., 'chunking', 'complements'
  attempted: number;
  correct: number;
  accuracyPct: number;
  avgTimePerQuestionSec: number;

  // EWMA mastery value used by the agent (0..1)
  masteryScore?: number;

  // Suggested action specific to this skill
  recommendation?: string;            // e.g., "Practice complements to 10 for speed."
}

export interface AgentNarrative {
  // One or two short paragraphs for the user
  summaryText: string;                // “You improved speed in Arithmetic by 12%…”
  nextStepsText: string;              // “Focus on complements; try a 10-min drill…”
  highlights?: string[];              // bullet points (max 3–4)
}

export interface QuestionReviewItem {
  questionSessionId: string;
  questionId: string;
  topic: TopicSlug;
  subtopic?: string;
  type: QuestionType;
  difficulty: number;                 // 1..5

  text: string;                       // rendered on review
  options?: { label: string; value: string }[];

  userAnswer: string;
  correctAnswer?: string;
  correct: boolean;
  timeTakenSec: number;

  // What the agent showed during/after the item
  hintsUsed?: number;
  strategyTip?: string;
  agentMessage?: string;              // encouragement/explanation

  // Optional links or IDs for deeper review
  explanationHtml?: string;
}

export interface ChartPoint {
  x: number | string;                 // index or ISO timestamp
  y: number;                          // value (pct/time/difficulty)
}

export interface Badge {
  code: string;                       // 'streak_5', 'speedster'
  label: string;                      // '5-Correct Streak'
  earnedAt: string;                   // ISO
}

export interface NextPracticePlan {
  // What to practice immediately (CTA)
  recommendedTopic: TopicSlug;
  suggestedSkills: string[];          // e.g., ['chunking','number-bonds']
  targetDifficulty: number;           // starting point, 1..5
  suggestedDurationMin: number;       // e.g., 10 or 20
  reason?: string;                    // concise rationale from agent
}
