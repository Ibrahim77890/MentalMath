from typing import Optional, List, Dict, Any
from datetime import datetime
from llm_instance import llm_service, llm_initialized
import uuid


from models import (
    STRATEGY_TIPS
)


llm = llm_service
LLM_AVAILABLE = llm_initialized is not None

def now_utc():
    return datetime.utcnow()

def make_session_id() -> str:
    return str(uuid.uuid4())

def pick_strategy_tip(topic: str, was_correct: bool, timeTaken: float, estimated: Optional[float] = None) -> str:
    # Use simple heuristics: if wrong -> give tip; if slow > estimated * 1.5 -> tip; else encouragement
    tips = STRATEGY_TIPS.get(topic, ["Try a step-by-step approach."])
    if not was_correct:
        return tips[0]
    if estimated and timeTaken > estimated * 1.5:
        return tips[1] if len(tips) > 1 else tips[0]
    return ""  # empty means no tip necessary

async def call_llm_for_text(prompt: str, max_tokens: int = 80) -> str:
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
    # If an LLM is available, try to generate a nicer message. Otherwise return fallback.
    if LLM_AVAILABLE:
        llm_text = await call_llm_for_text(template_prompt)
        if llm_text:
            return llm_text
    return fallback

def compute_session_stats(events: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
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
    # For demo: return a generated id; replace with HTTP request to backend questions service
    return f"q-{topic[:3].lower()}-{difficulty}-{uuid.uuid4().hex[:6]}"

# Decide next difficulty (basic rules)
def decide_next_difficulty(current: int, was_correct: bool, timeTaken: float, estimated: Optional[float]) -> int:
    if was_correct and (estimated is None or timeTaken <= max(estimated * 0.9, 1.0)):
        # quick and correct: bump difficulty by 1 (cap at 5)
        return min(current + 1, 5)
    if not was_correct or (estimated and timeTaken > (estimated * 1.5)):
        # struggle: reduce difficulty (min 1)
        return max(current - 1, 1)
    return current