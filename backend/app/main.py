from fastapi import FastAPI, HTTPException, Query
from typing import Optional

from . import db
from .models import (
    SubjectCreate, SessionCreate, HabitCreate, CheckinCreate,
)

app = FastAPI(title="Daily Log API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------- Subjects ----------

@app.get("/subjects")
def get_subjects():
    return db.list_subjects()


@app.post("/subjects", status_code=201)
def post_subject(body: SubjectCreate):
    return db.create_subject(body.name, body.color, body.goal_hours_per_week)


# ---------- Sessions ----------

@app.get("/sessions")
def get_sessions(
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
):
    return db.list_sessions(from_date, to_date)


@app.post("/sessions", status_code=201)
def post_session(body: SessionCreate):
    return db.create_session(body.subject_id, body.duration_min, body.notes, body.date)


# ---------- Habits ----------

@app.get("/habits")
def get_habits():
    return db.list_habits()


@app.post("/habits", status_code=201)
def post_habit(body: HabitCreate):
    return db.create_habit(body.name, body.icon)


# ---------- Check-ins ----------

@app.get("/checkins")
def get_checkins(date: Optional[str] = None):
    return db.list_checkins(date)


@app.post("/checkins", status_code=201)
def post_checkin(body: CheckinCreate):
    return db.upsert_checkin(body.habit_id, body.date, body.completed)