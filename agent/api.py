import datetime
import json
# from email.mime import message
from multiprocessing import pool
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
    get_pg_pool,
    compute_mastery,
    fetch_candidate_questions,
    pick_question_from_candidates,
    questions_coll,
    get_llm_response
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

@app.post("/agent/suggest-next-question-final", response_model=SuggestResponse)
async def suggest_next_question(event: AnswerEvent):
    # Get Session from postgresql
    pool = await get_pg_pool()
    async with pool.acquire() as conn:
        sess = await conn.fetchrow('SELECT id, "topicOrder", "startTime" FROM session WHERE id=$1', event.sessionId)
    if not sess:
        raise HTTPException(status_code=404, detail="Session not found")

    # Compute Mastery of User in this topic
    mastery = await compute_mastery(event.userId or "anonymous", event.topic)

    # Decide next difficulty based upon that mastery
    next_diff = max(1, min(5, event.difficulty + (1 if (mastery >= 0.8 and event.wasCorrect and event.timeTaken <= event.estimatedTime*0.9) else (-1 if (not event.wasCorrect or event.timeTaken > event.estimatedTime*1.5) else 0))))

    # Decide selection policy
    remedial = False
    if not event.wasCorrect:
        remedial = True

    # Gather Exclude lists (Questions already put in to user session)
    async with pool.acquire() as conn:
        rows = await conn.fetch('SELECT "questionId" FROM question_session WHERE "sessionId"=$1', event.sessionId)
    answered_ids = [r['questionId'] for r in rows]

    print("Answered IDs:", answered_ids)

    # Candidate selection based upon subtopic/skill at same or difficult level
    candidates = []
    if remedial:
        # try same subtopic with same difficulty for now
        candidates = await fetch_candidate_questions(event.topic, event.difficulty, answered_ids, subtopic=event.subtopic)
        if not candidates:
            candidates = await fetch_candidate_questions(event.topic, event.difficulty-1, answered_ids, subtopic=event.subtopic)
    else:
        candidates = await fetch_candidate_questions(event.topic, next_diff, answered_ids)

    # Fallback to any question if no candidates found
    if not candidates:
        candidates = await fetch_candidate_questions(event.topic, None, answered_ids)

    print("Candidates:", candidates)

    # Now compose message for user
    remaining_seconds = max(0, 3600 - int((datetime.datetime.utcnow() - sess['startTime']).total_seconds()))
    picked = pick_question_from_candidates(candidates, remaining_seconds)

    print("Picked:", picked)

    chosen_doc = None
    if picked:
        chosen_doc = await questions_coll.find_one({"_id": picked})
        strategy_tip = chosen_doc.get("strategyTip") or (chosen_doc.get("hints") or [None])[0]
    else:
        strategy_tip = "Try breaking problems into smaller parts."
    
    # compose message (LLM optional) - here we use simple fallback
    if not event.wasCorrect:
        fallback_msg = f"Don't worry — try this: {strategy_tip}"
    else:
        fallback_msg = "Nice work — keep going!"

    # Generate personalized agent message using LLaMA
    agent_message = fallback_msg  # default fallback
    if event.wasCorrect:
        prompt = f"""As a supportive math tutor, give a brief encouraging response (max 2 sentences) to a student who just correctly solved a {event.topic} question in {event.timeTaken} seconds (estimated time was {event.estimatedTime} seconds).
        Their mastery level is {mastery:.1%}.
        Next question will be difficulty level {next_diff}/5.
        Keep the tone positive and motivating."""
    else:
        prompt = f"""As a supportive math tutor, give a brief encouraging response (max 2 sentences) to a student who just attempted a {event.topic} question but made a mistake.
        Their mastery level is {mastery:.1%}.
        Include this strategy tip: {strategy_tip}
        Keep the tone supportive and constructive."""

    llm_response = await get_llm_response(prompt)
    if llm_response:
        agent_message = llm_response.strip()

    # store agent decision trace (insert into Postgres agent_decisions table)
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_decision (
                id SERIAL PRIMARY KEY,
                session_id UUID NOT NULL,
                prev_question_id VARCHAR(32),
                next_question_id VARCHAR(32),
                next_difficulty INT,
                mastery FLOAT,
                reason VARCHAR(32),
                trace JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            )
        """)
        await conn.execute("""
            INSERT INTO agent_decision(session_id, prev_question_id, next_question_id, next_difficulty, mastery, reason, trace)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
        """, event.sessionId, 
        event.questionId, 
        str(picked) if picked else None, 
        next_diff, 
        float(mastery), 
        "remedial" if remedial else "progress", 
        json.dumps({
            "mastery": mastery,
            "prompt": prompt,
            "llm_response": llm_response if llm_response else None
        }))

    reflection = "What method did you try?" if not event.wasCorrect else None

    return SuggestResponse(
        nextQuestionId=str(picked) if picked else None,
        nextDifficulty=next_diff,
        strategyTip=strategy_tip,
        message=agent_message,
        reflectionPrompt=reflection,
        trace={"mastery": mastery, "remedial": remedial}
    )

# Implemented for backend service
# @app.post("/agent/suggest-next-question", response_model=SuggestResponse)
# async def suggest_next(event: AnswerEvent):
#     """Suggest the next question based on the user's answer."""
#     # Validate session exists
#     if event.sessionId not in session_store:
#         raise HTTPException(status_code=404, detail="Session not found")
#     s = session_store[event.sessionId]

#     # record event
#     ev = {
#         "questionId": event.questionId,
#         "topic": event.topic,
#         "difficulty": event.difficulty,
#         "wasCorrect": event.wasCorrect,
#         "timeTaken": event.timeTaken,
#         "estimatedTime": event.estimatedTime,
#         "answer": event.answer,
#         "timestamp": now_utc().isoformat()
#     }
#     s["events"].append(ev)

#     # compute a strategy tip if needed
#     strategy_tip = pick_strategy_tip(event.topic, event.wasCorrect, event.timeTaken, event.estimatedTime)

#     # compute next difficulty
#     next_diff = decide_next_difficulty(event.difficulty, event.wasCorrect, event.timeTaken, event.estimatedTime)

#     # Example: if user failed, re-serve similar question or a simpler one
#     # fetch next question id (stub -> replace with real call)
#     next_qid = await fetch_question_id_for_topic(event.topic, next_diff)

#     # message generation (encouragement / reflection)
#     if not event.wasCorrect:
#         fallback_msg = f"Don't worry — you'll get it with practice. Try this tip: {strategy_tip}"
#         prompt = f"User failed a {event.topic} question. Suggest a short encouraging message and a short reflection prompt. Tip: {strategy_tip}"
#     else:
#         fallback_msg = "Nice work — keep going!"
#         prompt = f"User solved a {event.topic} question correctly in {event.timeTaken}s. Praise concisely and optionally suggest increasing difficulty."

#     message = await generate_message_with_optional_llm(prompt, fallback_msg)

#     reflection_prompt = "What method did you try?" if not event.wasCorrect else None

#     # Store agent feedback into session for later summary
#     feedback_entry = {
#         "timestamp": now_utc().isoformat(),
#         "message": message,
#         "type": "hint" if not event.wasCorrect else "encouragement",
#         "strategyTip": strategy_tip
#     }
#     s.setdefault("feedback", []).append(feedback_entry)

#     return SuggestResponse(
#         nextQuestionId=next_qid,
#         nextDifficulty=next_diff,
#         strategyTip=strategy_tip,
#         message=message,
#         reflectionPrompt=reflection_prompt
#     )

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