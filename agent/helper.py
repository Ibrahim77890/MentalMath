from typing import Optional, List, Dict, Any
from datetime import datetime
from llm_instance import llm_service, llm_initialized
import uuid
import motor.motor_asyncio
import asyncpg
import sys

import os
from dotenv import load_dotenv
from bson import ObjectId

import aiohttp
import asyncio
from typing import Optional

async def get_llm_response(prompt: str, timeout: int = 300) -> Optional[str]:
    """
    Call local LLaMA.cpp server with timeout
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'http://127.0.0.1:8080/completion',
                json={
                    "prompt": prompt,
                    "n_predict": 512,
                    "temperature": 0.7,
                    "stop": ["</s>"]
                },
                timeout=timeout
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get('content', '')
                return None
    except (aiohttp.ClientError, asyncio.TimeoutError):
        return None

from models import (
    STRATEGY_TIPS
)

llm = llm_service
LLM_AVAILABLE = llm_initialized is not None

load_dotenv()

MONGO_URL = os.getenv("MONGO_URI")
PG_DSN = os.getenv("DATABASE_URL")

if not MONGO_URL:
    print("Error: MONGO_URI environment variable is not set.")
    sys.exit(1)

if not PG_DSN:
    print("Error: DATABASE_URL environment variable is not set.")
    sys.exit(1)


mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
questions_coll = mongo_client.test.questions

# lightweight Postgres pool for aggregates; adapt to your orm
pg_pool: asyncpg.Pool = None

async def get_pg_pool():
    """Get a connection pool for PostgreSQL."""
    global pg_pool
    if pg_pool is None:
        pg_pool = await asyncpg.create_pool(dsn=PG_DSN)
    return pg_pool

def now_utc():
    """Get the current UTC time."""
    return datetime.utcnow()

def make_session_id() -> str:
    """Generate a new session ID."""
    return str(uuid.uuid4())

def pick_strategy_tip(topic: str, was_correct: bool, timeTaken: float, estimated: Optional[float] = None) -> str:
    """
    Pick a strategy tip based on the user's performance.
    """
    # Use simple heuristics: if wrong -> give tip; if slow > estimated * 1.5 -> tip; else encouragement
    tips = STRATEGY_TIPS.get(topic, ["Try a step-by-step approach."])
    if not was_correct:
        return tips[0]
    if estimated and timeTaken > estimated * 1.5:
        return tips[1] if len(tips) > 1 else tips[0]
    return ""  # empty means no tip necessary

async def call_llm_for_text(prompt: str, max_tokens: int = 80) -> str:
    """
    Call the LLM service to generate text based on the prompt.
    """
    if not LLM_AVAILABLE or llm is None:
        return ""
    # simple sync call through python binding; in heavy usage make this threaded or run in process pool
    try:
        resp = llm.generate(prompt, n_predict=max_tokens)
        # llama_cpp returns a dictionary with "choices" or "text" depending on version
        text = getattr(resp, "text", None) or resp.get("text") or resp.get("choices", [{}])[0].get("text", "")
        return (text or "").strip()
    except Exception:
        return ""

async def generate_message_with_optional_llm(template_prompt: str, fallback: str) -> str:
    """
    Generate a message using the LLM if available, otherwise return a fallback message.
    """
    # If an LLM is available, try to generate a nicer message. Otherwise return fallback.
    if LLM_AVAILABLE:
        llm_text = await call_llm_for_text(template_prompt)
        if llm_text:
            return llm_text
    return fallback

def compute_session_stats(events: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Compute statistics for a user's session based on the events.
    """
    per_topic: Dict[str, Dict[str, Any]] = {}
    for e in events:
        topic = e["topic"]
        if topic not in per_topic:
            per_topic[topic] = {"count": 0, "correct": 0, "total_time": 0.0}
        per_topic[topic]["count"] += 1
        per_topic[topic]["correct"] += 1 if e["wasCorrect"] else 0
        per_topic[topic]["total_time"] += e["timeTaken"]
    # finalize metrics
    for topic, stats in per_topic.items():
        stats["accuracy"] = round(100 * stats["correct"] / stats["count"], 2) if stats["count"] > 0 else 0.0
        stats["avg_time"] = round(stats["total_time"] / stats["count"], 2) if stats["count"] > 0 else 0.0
    return per_topic

# A stub question fetcher:
# In production, this should call the backend (NestJS) or query Mongo to find a question id by topic & difficulty.
async def fetch_question_id_for_topic(topic: str, difficulty: int) -> Optional[str]:
    """Fetch a question ID for a specific topic and difficulty."""
    # For demo: return a generated id; replace with HTTP request to backend questions service
    return f"q-{topic[:3].lower()}-{difficulty}-{uuid.uuid4().hex[:6]}"

async def compute_mastery(user_id: str, topic: str) -> float:
    """
    Compute the user's mastery level for a specific topic.
    """
    question_ids = await questions_coll.find({"topic": topic}, {"_id": 1}).to_list(length=None)
    question_id_list = [str(q["_id"]) for q in question_ids]
    pool = await get_pg_pool()
    # Select last 50 rows in db for this user on this particular topic
    async with pool.acquire() as conn:
        rec = await conn.fetchrow(
            """
             SELECT
            SUM(CASE WHEN qs.correct THEN 1 ELSE 0 END) as correct_count,
            COUNT(*) as total,
            AVG(qs."timeTaken"::float) as avg_time
            FROM (
            SELECT qs.*
            FROM question_session qs
            JOIN session s ON qs."sessionId" = s.id
            WHERE s."userId" = $1 AND qs."questionId" = ANY($2::text[])
            ORDER BY qs.timestamp DESC
            LIMIT 50
            ) qs
            """, user_id, question_id_list)
        # Compute mastery based on these rows
        if not rec or rec['total'] == 0:
            return 0.5
        correct_rate = rec['correct_count'] / rec['total']
        avg_time = rec['avg_time'] or 999
        # convert time to score relative to estimatedTime (use 1.0 if <= est)
        time_score = 1.0 if avg_time <= 30 else max(0, 1 - (avg_time-30)/60)
        mastery = 0.6*correct_rate + 0.4*time_score
        return max(0.0, min(1.0, mastery))
    
# helper: fetch candidate question ids from Mongo
async def fetch_candidate_questions(topic, difficulty=None, exclude_ids=None, subtopic=None, mental_skill=None, limit=50):
    """
    Fetch candidate question IDs from MongoDB based on various filters.
    """
    q = {"topic": topic}
    if difficulty is not None:
        q["difficulty"] = difficulty
    if subtopic:
        q["subtopic"] = subtopic
    if mental_skill:
        q["mentalSkill"] = mental_skill
    if exclude_ids:
        # Convert string IDs to ObjectId
        exclude_obj_ids = [ObjectId(eid) for eid in exclude_ids]
        q["_id"] = {"$nin": exclude_obj_ids}
    cursor = questions_coll.find(q, {"_id": 1, "estimatedTime":1, "hints":1, "strategyTip":1})
    res = []
    async for doc in cursor:
        res.append(doc)
        if len(res) >= limit:
            break
    return res

# helper: pick from candidates with weighting (prefer unattempted + estimatedTime fit)
def pick_question_from_candidates(candidates, remaining_seconds=None):
    """
    Pick a question from the candidates based on a weighted random choice.
    """
    if not candidates:
        return None
    import random, math
    weights = []
    for c in candidates:
        # prefer shorter estimatedTime if low remaining_seconds
        est = c.get("estimatedTime",30)
        w = 1.0
        if remaining_seconds and est > remaining_seconds/6:
            w *= 0.5
        # slightly prefer ones with no hints? (example)
        if not c.get("hints"):
            w *= 1.1
        weights.append(w)
    idx = random.choices(range(len(candidates)), weights=weights, k=1)[0]
    return candidates[idx]["_id"]

# Decide next difficulty (basic rules)
def decide_next_difficulty(current: int, was_correct: bool, timeTaken: float, estimated: Optional[float]) -> int:
    if was_correct and (estimated is None or timeTaken <= max(estimated * 0.9, 1.0)):
        # quick and correct: bump difficulty by 1 (cap at 5)
        return min(current + 1, 5)
    if not was_correct or (estimated and timeTaken > (estimated * 1.5)):
        # struggle: reduce difficulty (min 1)
        return max(current - 1, 1)
    return current

import aiohttp
import asyncio
from typing import Optional

async def get_llm_response(prompt: str, timeout: int = 300) -> Optional[str]:
    """
    Call local LLaMA.cpp server with timeout
    """
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'http://127.0.0.1:8080/completion',
                json={
                    "prompt": prompt,
                    "n_predict": 512,
                    "temperature": 0.7,
                    "stop": ["</s>"]
                },
                timeout=timeout
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get('content', '')
                return None
    except (aiohttp.ClientError, asyncio.TimeoutError):
        return None