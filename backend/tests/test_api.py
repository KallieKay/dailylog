from fastapi.testclient import TestClient


def test_health():
    from app.main import app
    client = TestClient(app)
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_and_list_subject(dynamo_table):
    import importlib
    import app.db as db_module
    import app.main as main_module
    importlib.reload(db_module)
    importlib.reload(main_module)

    client = TestClient(main_module.app)
    r = client.post("/subjects", json={"name": "Math", "color": "#ff0000", "goal_hours_per_week": 5})
    assert r.status_code == 201
    assert r.json()["name"] == "Math"

    r = client.get("/subjects")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_create_and_list_session(dynamo_table):
    import importlib
    import app.db as db_module
    import app.main as main_module
    importlib.reload(db_module)
    importlib.reload(main_module)

    client = TestClient(main_module.app)
    subj = client.post("/subjects", json={"name": "Physics", "goal_hours_per_week": 3}).json()

    r = client.post("/sessions", json={
        "subject_id": subj["id"],
        "duration_min": 60,
        "notes": "Ch. 3",
        "date": "2026-01-15",
    })
    assert r.status_code == 201

    r = client.get("/sessions?from=2026-01-15&to=2026-01-15")
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["duration_min"] == 60


def test_create_and_list_habit(dynamo_table):
    import importlib
    import app.db as db_module
    import app.main as main_module
    importlib.reload(db_module)
    importlib.reload(main_module)

    client = TestClient(main_module.app)
    r = client.post("/habits", json={"name": "Exercise", "icon": "🏃"})
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Exercise"
    assert data["icon"] == "🏃"
    assert "id" in data

    r = client.get("/habits")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_create_and_list_checkin(dynamo_table):
    import importlib
    import app.db as db_module
    import app.main as main_module
    importlib.reload(db_module)
    importlib.reload(main_module)

    client = TestClient(main_module.app)
    habit = client.post("/habits", json={"name": "Sleep 8h", "icon": "😴"}).json()

    r = client.post("/checkins", json={
        "habit_id": habit["id"],
        "date": "2026-01-15",
        "completed": True,
    })
    assert r.status_code == 201
    data = r.json()
    assert data["habit_id"] == habit["id"]
    assert data["completed"] is True

    r = client.get("/checkins?date=2026-01-15")
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["completed"] is True


def test_checkin_upsert(dynamo_table):
    """Toggling a check-in updates the same item, not creates a new one."""
    import importlib
    import app.db as db_module
    import app.main as main_module
    importlib.reload(db_module)
    importlib.reload(main_module)

    client = TestClient(main_module.app)
    habit = client.post("/habits", json={"name": "Water", "icon": "💧"}).json()

    # Check in
    client.post("/checkins", json={"habit_id": habit["id"], "date": "2026-01-15", "completed": True})
    # Uncheck
    client.post("/checkins", json={"habit_id": habit["id"], "date": "2026-01-15", "completed": False})

    r = client.get("/checkins?date=2026-01-15")
    assert len(r.json()) == 1          # still one item, not two
    assert r.json()[0]["completed"] is False
