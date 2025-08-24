import type { EndSessionSummary } from '../types/end-session.type';

export const SAMPLE_END_SESSION: EndSessionSummary = {
  sessionId: "sample-123",
  userId: "user-456",
  startedAt: new Date(Date.now() - 3600000).toISOString(),
  endedAt: new Date().toISOString(),
  durationSec: 3600,

  kpis: {
    totalQuestions: 20,
    attempted: 18,
    correct: 15,
    accuracyPct: 83.33,
    avgTimePerQuestionSec: 45,
    streakBest: 7,
    hintsUsed: 2
  },

  topics: [
    {
      topic: 'Arithmetic',
      subtopicsCovered: ['Addition', 'Multiplication'],
      attempted: 10,
      correct: 8,
      accuracyPct: 80,
      avgTimePerQuestionSec: 40,
      skills: [
        {
          skill: 'chunking',
          attempted: 5,
          correct: 4,
          accuracyPct: 80,
          avgTimePerQuestionSec: 35,
          masteryScore: 0.75
        }
      ],
      deltas: {
        accuracyPctDelta: 5.5,
        timePerQuestionDeltaSec: -8,
        difficultyDelta: 0.5
      }
    }
  ],

  agent: {
    summaryText: "Great progress! You've shown significant improvement in arithmetic operations, particularly in addition speed.",
    nextStepsText: "Consider focusing on multiplication next to build on your strong addition skills.",
    highlights: [
      "7-question correct streak - your best yet!",
      "20% faster on addition problems",
      "Ready for higher difficulty in arithmetic"
    ]
  },

  review: [
    {
      questionSessionId: "qs-789",
      questionId: "q-123",
      topic: 'Arithmetic',
      subtopic: 'Addition',
      type: 'numeric',
      difficulty: 3,
      text: "What is 127 + 235?",
      userAnswer: "362",
      correctAnswer: "362",
      correct: true,
      timeTakenSec: 25,
      strategyTip: "Try breaking into hundreds, tens, and ones"
    }
  ],

  charts: {
    accuracyOverTime: [
      { x: 1, y: 60 },
      { x: 2, y: 70 },
      { x: 3, y: 75 },
      { x: 4, y: 83 }
    ]
  },

  achievements: [
    {
      code: 'streak_5',
      label: '5-Question Streak',
      earnedAt: new Date().toISOString()
    }
  ],

  nextPlan: {
    recommendedTopic: 'Arithmetic',
    suggestedSkills: ['multiplication', 'estimation'],
    targetDifficulty: 3,
    suggestedDurationMin: 15,
    reason: "You're ready to tackle multiplication with your solid addition skills"
  }
};