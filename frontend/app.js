const API_URL = "%%API_URL%%";

const subjectsList = document.getElementById("subjects-list");
const sessionsList = document.getElementById("sessions-list");
const summaryEl = document.getElementById("summary");
const subjectForm = document.getElementById("subject-form");
const sessionForm = document.getElementById("session-form");
const subjectSelect = sessionForm.querySelector('select[name="subject_id"]');
const toast = document.getElementById("toast");
const habitsList = document.getElementById("habits-list");
const habitForm = document.getElementById("habit-form");

let subjects = [];
let habits = [];
let todayCheckins = {};  // habit_id -> boolean

function today() {
    return new Date().toISOString().slice(0, 10);
}

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.remove("hidden");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.add("hidden"), 2500);
}

async function api(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        headers: { "content-type": "application/json" },
        ...options,
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.json();
}

function renderSubjects() {
    if (!subjects.length) {
        subjectsList.innerHTML = '<div class="empty">No subjects yet.</div>';
        return;
    }
    subjectsList.innerHTML = subjects
        .map(s => `<div class="item"><span>${s.name}</span><span>${s.goal_hours_per_week}h / week</span></div>`)
        .join("");
    subjectSelect.innerHTML = subjects
        .map(s => `<option value="${s.id}">${s.name}</option>`)
        .join("");
}

function renderSessions(sessions) {
    if (!sessions.length) {
        sessionsList.innerHTML = '<div class="empty">No sessions logged today.</div>';
        return;
    }
    sessionsList.innerHTML = sessions.map(s => {
        const subj = subjects.find(x => x.id === s.subject_id);
        const name = subj ? subj.name : "Unknown";
        const notes = s.notes ? ` — ${s.notes}` : "";
        return `<div class="item"><span>${name}${notes}</span><span>${s.duration_min} min</span></div>`;
    }).join("");
}

function renderSummary(sessions) {
    if (!sessions.length) {
        summaryEl.innerHTML = '<div class="empty">No study time logged this week.</div>';
        return;
    }
    const totals = {};
    for (const s of sessions) {
        const subj = subjects.find(x => x.id === s.subject_id);
        const name = subj ? subj.name : "Unknown";
        totals[name] = (totals[name] || 0) + s.duration_min;
    }
    summaryEl.innerHTML = Object.entries(totals)
        .map(([name, min]) => `<div class="item"><span>${name}</span><span>${(min / 60).toFixed(1)}h</span></div>`)
        .join("");
}

function renderHabits() {
    if (!habits.length) {
        habitsList.innerHTML = '<div class="empty">No habits yet. Add one below.</div>';
        return;
    }
    habitsList.innerHTML = habits.map(h => {
        const checked = todayCheckins[h.id] === true;
        return `
      <div class="habit-row">
        <button
          class="habit-toggle ${checked ? "checked" : ""}"
          data-habit-id="${h.id}"
          title="${checked ? "Uncheck" : "Check"}"
        >${checked ? "✓" : ""}</button>
        <span class="habit-name ${checked ? "checked" : ""}">${h.icon ? h.icon + " " : ""}${h.name}</span>
      </div>
    `;
    }).join("");

    habitsList.querySelectorAll(".habit-toggle").forEach(btn => {
        btn.addEventListener("click", () => toggleCheckin(btn.dataset.habitId));
    });
}

async function loadHabits() {
    habits = await api("/habits");
    renderHabits();
}

async function loadCheckins() {
    const t = today();
    const checkins = await api(`/checkins?date=${t}`);
    todayCheckins = {};
    for (const c of checkins) {
        todayCheckins[c.habit_id] = c.completed;
    }
}

async function toggleCheckin(habitId) {
    const newState = !(todayCheckins[habitId] === true);
    try {
        await api("/checkins", {
            method: "POST",
            body: JSON.stringify({ habit_id: habitId, completed: newState }),
        });
        todayCheckins[habitId] = newState;
        renderHabits();
        showToast(newState ? "Checked in" : "Unchecked");
    } catch (err) {
        showToast(err.message, true);
    }
}

async function loadSubjects() {
    subjects = await api("/subjects");
    renderSubjects();
}

async function loadSessions() {
    const t = today();
    const sessions = await api(`/sessions?from=${t}&to=${t}`);
    renderSessions(sessions);
}

async function loadWeekSummary() {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day - 1));
    const from = monday.toISOString().slice(0, 10);
    const to = today();

    const sessions = await api(`/sessions?from=${from}&to=${to}`);

    // Study section
    let studyHtml = "";
    if (sessions.length) {
        const totals = {};
        for (const s of sessions) {
            const subj = subjects.find(x => x.id === s.subject_id);
            const name = subj ? subj.name : "Unknown";
            totals[name] = (totals[name] || 0) + s.duration_min;
        }
        studyHtml = Object.entries(totals)
            .map(([name, min]) => `<div class="item"><span>${name}</span><span>${(min / 60).toFixed(1)}h</span></div>`)
            .join("");
    } else {
        studyHtml = '<div class="empty">No study time logged this week.</div>';
    }

    // Habits section — count check-ins per habit across the last 7 days
    let habitsHtml = "";
    if (habits.length) {
        const counts = {};
        for (const h of habits) counts[h.id] = 0;

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dateStr = d.toISOString().slice(0, 10);
            try {
                const dayCheckins = await api(`/checkins?date=${dateStr}`);
                for (const c of dayCheckins) {
                    if (c.completed && counts[c.habit_id] !== undefined) {
                        counts[c.habit_id]++;
                    }
                }
            } catch (_) { /* skip failed day */ }
        }

        habitsHtml = habits
            .map(h => {
                const done = counts[h.id];
                const pct = Math.round((done / 7) * 100);
                return `<div class="item"><span>${h.icon ? h.icon + " " : ""}${h.name}</span><span>${done}/7 (${pct}%)</span></div>`;
            })
            .join("");
    } else {
        habitsHtml = '<div class="empty">No habits yet.</div>';
    }

    summaryEl.innerHTML = `
        <div class="summary-group">
            <h3>Study</h3>
            ${studyHtml}
        </div>
        <div class="summary-group">
            <h3>Habits</h3>
            ${habitsHtml}
        </div>
    `;
}

subjectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(subjectForm);
    const body = {
        name: fd.get("name"),
        goal_hours_per_week: parseFloat(fd.get("goal_hours_per_week")) || 0,
    };
    try {
        await api("/subjects", { method: "POST", body: JSON.stringify(body) });
        subjectForm.reset();
        showToast("Subject added");
        await loadSubjects();
    } catch (err) { showToast(err.message, true); }
});

sessionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(sessionForm);
    const body = {
        subject_id: fd.get("subject_id"),
        duration_min: parseInt(fd.get("duration_min"), 10),
        notes: fd.get("notes") || "",
    };
    try {
        await api("/sessions", { method: "POST", body: JSON.stringify(body) });
        sessionForm.reset();
        showToast("Session logged");
        await loadSessions();
        await loadWeekSummary();
    } catch (err) { showToast(err.message, true); }
});

habitForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(habitForm);
    const body = {
        name: fd.get("name"),
        icon: fd.get("icon") || "✅",
    };
    try {
        await api("/habits", { method: "POST", body: JSON.stringify(body) });
        habitForm.reset();
        showToast("Habit added");
        await loadHabits();
    } catch (err) {
        showToast(err.message, true);
    }
});

(async function init() {
    try {
        await loadSubjects();
        await loadSessions();
        await loadHabits();
        await loadCheckins();
        renderHabits();
        await loadWeekSummary();
    } catch (err) { showToast("Failed to load: " + err.message, true); }
})();