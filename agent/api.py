from fastapi import FastAPI, HTTPException

from models import (
    StartSessionRequest,
    StartSessionResponse,
    SuggestResponse,
    AnswerEvent,
    EndSessionRequest,
    SessionSummary,
    session_store
)

from helper import (
    make_session_id,
    now_utc,
    pick_strategy_tip,
    decide_next_difficulty,
    fetch_question_id_for_topic,
    compute_session_stats,
    generate_message_with_optional_llm,
)

from llm_instance import llm_initialized

app = FastAPI(title="MentalMath Agent")
@app.post("/session/start", response_model=StartSessionResponse)
async def start_session(req: StartSessionRequest):
    sid = req.sessionId or make_session_id()
    started = now_utc()
    session_store[sid] = {
        "sessionId": sid,
        "userId": req.userId,
        "topicOrder": req.topicOrder,
        "startedAt": started,
        "events": [],
        "stats": {},
        "last_prompt_time": started
    }
    return StartSessionResponse(sessionId=sid, startedAt=started)

@app.post("/agent/suggest-next", response_model=SuggestResponse)
async def suggest_next(event: AnswerEvent):
    # Validate session exists
    if event.sessionId not in session_store:
        raise HTTPException(status_code=404, detail="Session not found")
    s = session_store[event.sessionId]

    # record event
    ev = {
        "questionId": event.questionId,
        "topic": event.topic,
        "difficulty": event.difficulty,
        "wasCorrect": event.wasCorrect,
        "timeTaken": event.timeTaken,
        "estimatedTime": event.estimatedTime,
        "answer": event.answer,
        "timestamp": now_utc().isoformat()
    }
    s["events"].append(ev)

    # compute a strategy tip if needed
    strategy_tip = pick_strategy_tip(event.topic, event.wasCorrect, event.timeTaken, event.estimatedTime)

    # compute next difficulty
    next_diff = decide_next_difficulty(event.difficulty, event.wasCorrect, event.timeTaken, event.estimatedTime)

    # Example: if user failed, re-serve similar question or a simpler one
    # fetch next question id (stub -> replace with real call)
    next_qid = await fetch_question_id_for_topic(event.topic, next_diff)

    # message generation (encouragement / reflection)
    if not event.wasCorrect:
        fallback_msg = f"Don't worry — you'll get it with practice. Try this tip: {strategy_tip}"
        prompt = f"User failed a {event.topic} question. Suggest a short encouraging message and a short reflection prompt. Tip: {strategy_tip}"
    else:
        fallback_msg = "Nice work — keep going!"
        prompt = f"User solved a {event.topic} question correctly in {event.timeTaken}s. Praise concisely and optionally suggest increasing difficulty."

    message = await generate_message_with_optional_llm(prompt, fallback_msg)

    reflection_prompt = "What method did you try?" if not event.wasCorrect else None

    # Store agent feedback into session for later summary
    feedback_entry = {
        "timestamp": now_utc().isoformat(),
        "message": message,
        "type": "hint" if not event.wasCorrect else "encouragement",
        "strategyTip": strategy_tip
    }
    s.setdefault("feedback", []).append(feedback_entry)

    return SuggestResponse(
        nextQuestionId=next_qid,
        nextDifficulty=next_diff,
        strategyTip=strategy_tip,
        message=message,
        reflectionPrompt=reflection_prompt
    )

@app.post("/session/end", response_model=SessionSummary)
async def end_session(req: EndSessionRequest):
    if req.sessionId not in session_store:
        raise HTTPException(status_code=404, detail="Session not found")
    s = session_store[req.sessionId]
    endedAt = now_utc()
    events = s.get("events", [])

    per_topic = compute_session_stats(events)
    total_questions = sum(v["count"] for v in per_topic.values()) if per_topic else 0
    total_correct = sum(v["correct"] for v in per_topic.values()) if per_topic else 0
    overall_accuracy = round(100 * total_correct / total_questions, 2) if total_questions else 0.0

    # Create recommendations (simple heuristics)
    recommendations = []
    for topic, stats in per_topic.items():
        if stats["accuracy"] < 70:
            recommendations.append(f"Review basics of {topic} and try 10 easy questions.")
        elif stats["accuracy"] < 90:
            recommendations.append(f"Practice more problems in {topic} at current difficulty to improve speed.")
        else:
            recommendations.append(f"Try advanced questions in {topic} to challenge yourself.")

    # Optionally, generate a nicer summary with LLM
    prompt = f"""Session summary:
    sessionId: {req.sessionId}
    perTopic: {per_topic}
    overall accuracy: {overall_accuracy}
    Provide a concise friendly summary + 2 actionable recommendations."""

    llm_summary = await generate_message_with_optional_llm(prompt, "")

    if llm_summary:
        recommendations.insert(0, llm_summary)

    # persist summary into session store (in real life -> write to SQL)
    s["endedAt"] = endedAt
    s["perTopicStats"] = per_topic
    s["overallAccuracy"] = overall_accuracy
    s["recommendations"] = recommendations

    return SessionSummary(
        sessionId=req.sessionId,
        startedAt=s["startedAt"],
        endedAt=endedAt,
        perTopicStats=per_topic,
        overallAccuracy=overall_accuracy,
        recommendations=recommendations
    )

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "llm_initialized": llm_initialized}