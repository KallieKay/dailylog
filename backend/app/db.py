#Heart of the App. Single-table access patterns all in one file.
import boto3
import uuid
from datetime import datetime, date
from typing import Optional

from .config import TABLE_NAME, AWS_REGION, USER_ID

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)


def _now() -> str:
    return datetime.utcnow().isoformat()


def _today() -> str:
    return date.today().isoformat()


# ---------- Subjects ----------

def list_subjects() -> list[dict]:
    resp = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues={":pk": USER_ID, ":sk": "SUBJECT#"},
    )
    return [_subject_from_item(i) for i in resp["Items"]]


def create_subject(name: str, color: str, goal_hours_per_week: float) -> dict:
    sid = str(uuid.uuid4())[:8]
    item = {
        "PK": USER_ID,
        "SK": f"SUBJECT#{sid}",
        "id": sid,
        "name": name,
        "color": color,
        "goal_hours_per_week": str(goal_hours_per_week),
        "created_at": _now(),
    }
    table.put_item(Item=item)
    return _subject_from_item(item)


def _subject_from_item(item: dict) -> dict:
    return {
        "id": item["id"],
        "name": item["name"],
        "color": item.get("color", "#3b82f6"),
        "goal_hours_per_week": float(item.get("goal_hours_per_week", 0)),
    }


# ---------- Sessions ----------

def list_sessions(from_date: Optional[str], to_date: Optional[str]) -> list[dict]:
    from_date = from_date or _today()
    to_date = to_date or _today()
    resp = table.query(
        KeyConditionExpression="PK = :pk AND SK BETWEEN :a AND :b",
        ExpressionAttributeValues={
            ":pk": USER_ID,
            ":a": f"SESSION#{from_date}",
            ":b": f"SESSION#{to_date}#zzzz",
        },
    )
    return [_session_from_item(i) for i in resp["Items"]]


def create_session(subject_id: str, duration_min: int, notes: str, sess_date: Optional[str]) -> dict:
    sess_date = sess_date or _today()
    sid = str(uuid.uuid4())[:8]
    item = {
        "PK": USER_ID,
        "SK": f"SESSION#{sess_date}#{sid}",
        "id": sid,
        "subject_id": subject_id,
        "duration_min": duration_min,
        "notes": notes or "",
        "date": sess_date,
        "created_at": _now(),
    }
    table.put_item(Item=item)
    return _session_from_item(item)


def _session_from_item(item: dict) -> dict:
    return {
        "id": item["id"],
        "subject_id": item["subject_id"],
        "duration_min": int(item["duration_min"]),
        "notes": item.get("notes", ""),
        "date": item["date"],
        "created_at": item.get("created_at", ""),
    }


# ---------- Habits ----------

def list_habits() -> list[dict]:
    resp = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues={":pk": USER_ID, ":sk": "HABIT#"},
    )
    return [_habit_from_item(i) for i in resp["Items"]]


def create_habit(name: str, icon: str) -> dict:
    hid = str(uuid.uuid4())[:8]
    item = {
        "PK": USER_ID,
        "SK": f"HABIT#{hid}",
        "id": hid,
        "name": name,
        "icon": icon,
        "active": True,
        "created_at": _now(),
    }
    table.put_item(Item=item)
    return _habit_from_item(item)


def _habit_from_item(item: dict) -> dict:
    return {
        "id": item["id"],
        "name": item["name"],
        "icon": item.get("icon", "✅"),
        "active": item.get("active", True),
    }


# ---------- Check-ins ----------

def list_checkins(for_date: Optional[str]) -> list[dict]:
    for_date = for_date or _today()
    resp = table.query(
        KeyConditionExpression="PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues={":pk": USER_ID, ":sk": f"CHECKIN#{for_date}"},
    )
    return [_checkin_from_item(i) for i in resp["Items"]]


def upsert_checkin(habit_id: str, checkin_date: Optional[str], completed: bool) -> dict:
    checkin_date = checkin_date or _today()
    item = {
        "PK": USER_ID,
        "SK": f"CHECKIN#{checkin_date}#{habit_id}",
        "habit_id": habit_id,
        "date": checkin_date,
        "completed": completed,
        "created_at": _now(),
    }
    table.put_item(Item=item)
    return _checkin_from_item(item)


def _checkin_from_item(item: dict) -> dict:
    return {
        "habit_id": item["habit_id"],
        "date": item["date"],
        "completed": bool(item["completed"]),
    }

#This is clean because every access pattern is a single query, no scans,no GSIs.
