from pydantic import BaseModel, Field
from typing import Optional
from datetime import date


class SubjectCreate(BaseModel):
    name: str
    color: Optional[str] = "#3b82f6"
    goal_hours_per_week: Optional[float] = 0.0


class Subject(BaseModel):
    id: str
    name: str
    color: str
    goal_hours_per_week: float


class SessionCreate(BaseModel):
    subject_id: str
    duration_min: int = Field(..., gt=0, le=1440)
    notes: Optional[str] = ""
    date: Optional[str] = None  # YYYY-MM-DD, defaults to today


class Session(BaseModel):
    id: str
    subject_id: str
    duration_min: int
    notes: str
    date: str
    created_at: str


class HabitCreate(BaseModel):
    name: str
    icon: Optional[str] = "✅"


class Habit(BaseModel):
    id: str
    name: str
    icon: str
    active: bool = True


class CheckinCreate(BaseModel):
    habit_id: str
    date: Optional[str] = None
    completed: bool = True