from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import uuid
import asyncio

class StartSessionRequest(BaseModel):
    sessionId: Optional[str] = None
    userId: Optional[str] = None
    topicOrder: List[str]

class StartSessionResponse(BaseModel):
    sessionId: str
    startedAt: datetime

class AnswerEvent(BaseModel):
    sessionId: str
    questionId: str
    topic: str
    difficulty: int
    wasCorrect: bool
    timeTaken: float  # seconds
    estimatedTime: Optional[float] = None  # seconds (from question metadata)
    answer: Optional[str] = None

class SuggestResponse(BaseModel):
    nextQuestionId: Optional[str]
    nextDifficulty: Optional[int]
    strategyTip: str
    message: str
    reflectionPrompt: Optional[str]

class EndSessionRequest(BaseModel):
    sessionId: str

class SessionSummary(BaseModel):
    sessionId: str
    startedAt: datetime
    endedAt: datetime
    perTopicStats: Dict[str, Dict[str, Any]]
    overallAccuracy: float
    recommendations: List[str]

# -------------- In-memory store (demo only) ----------
# session_store[sessionId] = { startedAt, topicOrder, events: [AnswerEvent...], stats... }
session_store: Dict[str, Dict[str, Any]] = {}

# A small mapping of strategy tips per topic. Extend / move to DB.
STRATEGY_TIPS = {
    "Arithmetic": [
        "Use chunking: break big numbers into smaller chunks (e.g., 47×6 = 40×6 + 7×6).",
        "Use complements for subtraction: 100 - 37 = 63 (think complements).",
        "Use doubling/halving for multiplication with even factors."
    ],
    "Algebra": [
        "Move constants to the other side first, then isolate the variable.",
        "Try plugging small integers to check solutions quickly.",
        "Simplify both sides by combining like terms before solving."
    ],
    "DiffEq": [
        "Identify if this is separable or linear; separate variables if possible.",
        "Try to find an integrating factor for first-order linear equations.",
        "Check for special solutions like constants or simple polynomials first."
    ],
    "WordProblem": [
        "Translate phrases to equations step-by-step; label unknowns explicitly.",
        "Draw a quick diagram or timeline for motion/age problems.",
        "Identify what is being asked: final value, rate, or total."
    ]
}
