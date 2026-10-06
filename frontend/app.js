const API_URL = "%%API_URL%%";

const subjectsList = document.getElementById("subjects-list");
const sessionsList = document.getElementById("sessions-list");
const summaryEl = document.getElementById("summary");
const subjectForm = document.getElementById("subject-form");
const sessionForm = document.getElementById("session-form");
const subjectSelect = sessionForm.querySelector('select[name="subject_id"]');
const toast = document.getElementById("toast");

let subjects = [];

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
    const sessions = await api(`/sessions?from=${from}&to=${today()}`);
    renderSummary(sessions);
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

(async function init() {
    try {
        await loadSubjects();
        await loadSessions();
        await loadWeekSummary();
    } catch (err) { showToast("Failed to load: " + err.message, true); }
})();