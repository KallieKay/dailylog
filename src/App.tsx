import React, { useState, useEffect, useRef } from 'react';
import { Subject, Session, Habit, Checkin } from './types';
import { storage, today, getWeekDates, removeEmojis } from './storage';

export default function App() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);

  // Form states
  const [subjectName, setSubjectName] = useState('');
  const [subjectGoal, setSubjectGoal] = useState('');

  const [sessionSubjectId, setSessionSubjectId] = useState('');
  const [sessionDuration, setSessionDuration] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');

  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState('');

  // Toast state
  const [toast, setToast] = useState<{ message: string; isError: boolean; visible: boolean }>({
    message: '',
    isError: false,
    visible: false,
  });
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (message: string, isError = false) => {
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setToast({ message, isError, visible: true });
    toastTimeoutRef.current = window.setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 2500);
  };

  // Initial load
  useEffect(() => {
    const loadedSubjects = storage.getSubjects();
    const loadedSessions = storage.getSessions();
    const loadedHabits = storage.getHabits();
    const loadedCheckins = storage.getCheckins();

    setSubjects(loadedSubjects);
    setSessions(loadedSessions);
    setHabits(loadedHabits);
    setCheckins(loadedCheckins);

    if (loadedSubjects.length > 0) {
      setSessionSubjectId(loadedSubjects[0].id);
    }
  }, []);

  // Update session subject select default if subjects change and no subject is selected
  useEffect(() => {
    if (subjects.length > 0 && (!sessionSubjectId || !subjects.some(s => s.id === sessionSubjectId))) {
      setSessionSubjectId(subjects[0].id);
    }
  }, [subjects, sessionSubjectId]);

  // Handlers
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = subjectName.trim();
    if (!trimmed) return;

    const newSubject: Subject = {
      id: 'sub-' + Math.random().toString(36).substring(2, 9),
      name: trimmed,
      goal_hours_per_week: parseFloat(subjectGoal) || 0,
      color: '#3b82f6',
    };

    const updated = [...subjects, newSubject];
    setSubjects(updated);
    storage.saveSubjects(updated);
    setSubjectName('');
    setSubjectGoal('');
    showToast('Subject added');
  };

  const handleLogSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionSubjectId) {
      showToast('Please select a subject', true);
      return;
    }
    const mins = parseInt(sessionDuration, 10);
    if (isNaN(mins) || mins <= 0 || mins > 1440) {
      showToast('Duration must be between 1 and 1440 minutes', true);
      return;
    }

    const todayDate = today();
    const newSession: Session = {
      id: 'sess-' + Math.random().toString(36).substring(2, 9),
      subject_id: sessionSubjectId,
      duration_min: mins,
      notes: sessionNotes.trim(),
      date: todayDate,
      created_at: new Date().toISOString(),
    };

    const updated = [newSession, ...sessions];
    setSessions(updated);
    storage.saveSessions(updated);
    setSessionDuration('');
    setSessionNotes('');
    showToast('Session logged');
  };

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = habitName.trim();
    if (!trimmed) return;

    const newHabit: Habit = {
      id: 'hab-' + Math.random().toString(36).substring(2, 9),
      name: removeEmojis(trimmed),
      icon: removeEmojis(habitIcon.trim()),
      active: true,
    };

    const updated = [...habits, newHabit];
    setHabits(updated);
    storage.saveHabits(updated);
    setHabitName('');
    setHabitIcon('');
    showToast('Habit added');
  };

  const toggleCheckin = (habitId: string) => {
    const todayDate = today();
    const existing = checkins.find(c => c.habit_id === habitId && c.date === todayDate);
    const newState = !(existing && existing.completed);

    let updatedCheckins: Checkin[];
    if (existing) {
      updatedCheckins = checkins.map(c =>
        c.habit_id === habitId && c.date === todayDate ? { ...c, completed: newState } : c
      );
    } else {
      updatedCheckins = [...checkins, { habit_id: habitId, date: todayDate, completed: newState }];
    }

    setCheckins(updatedCheckins);
    storage.saveCheckins(updatedCheckins);
    showToast(newState ? 'Checked in' : 'Unchecked');
  };

  // Calculations for Today & Week
  const todayDate = today();
  const todaySessions = sessions.filter(s => s.date === todayDate);

  const { from: weekFrom, to: weekTo, days: weekDays } = getWeekDates();
  const weekSessions = sessions.filter(s => s.date >= weekFrom && s.date <= weekTo);

  // Group study time by subject
  const weekStudyTotals: Record<string, number> = {};
  for (const s of weekSessions) {
    const subj = subjects.find(x => x.id === s.subject_id);
    const name = subj ? subj.name : 'Unknown';
    weekStudyTotals[name] = (weekStudyTotals[name] || 0) + s.duration_min;
  }

  // Calculate habit check-in counts for current week
  const habitWeekCounts: Record<string, number> = {};
  for (const h of habits) {
    habitWeekCounts[h.id] = 0;
  }
  for (const d of weekDays) {
    for (const c of checkins) {
      if (c.date === d && c.completed && habitWeekCounts[c.habit_id] !== undefined) {
        habitWeekCounts[c.habit_id]++;
      }
    }
  }

  return (
    <>
      <header>
        <h1>Daily Flow</h1>
        <p className="subtitle">Study with rhythm. Track your habits. Grow every day.</p>
      </header>

      <main>
        {/* Subjects Section */}
        <section id="subjects-section">
          <h2>Subjects</h2>
          <div id="subjects-list" className="list">
            {subjects.length === 0 ? (
              <div className="empty">No subjects yet.</div>
            ) : (
              subjects.map(s => (
                <div key={s.id} className="item">
                  <span>{s.name}</span>
                  <span>{s.goal_hours_per_week}h / week</span>
                </div>
              ))
            )}
          </div>
          <form id="subject-form" onSubmit={handleAddSubject}>
            <input
              name="name"
              placeholder="Subject name"
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              required
            />
            <input
              name="goal_hours_per_week"
              type="number"
              step="0.5"
              min="0"
              placeholder="Goal hrs/week"
              value={subjectGoal}
              onChange={e => setSubjectGoal(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>
        </section>

        {/* Sessions Section */}
        <section id="sessions-section">
          <h2>Today's Sessions</h2>
          <div id="sessions-list" className="list">
            {todaySessions.length === 0 ? (
              <div className="empty">No sessions logged today.</div>
            ) : (
              todaySessions.map(s => {
                const subj = subjects.find(x => x.id === s.subject_id);
                const name = subj ? subj.name : 'Unknown';
                const notes = s.notes ? ` — ${s.notes}` : '';
                return (
                  <div key={s.id} className="item">
                    <span>
                      {name}
                      {notes}
                    </span>
                    <span>{s.duration_min} min</span>
                  </div>
                );
              })
            )}
          </div>
          <form id="session-form" onSubmit={handleLogSession}>
            <select
              name="subject_id"
              value={sessionSubjectId}
              onChange={e => setSessionSubjectId(e.target.value)}
              required
            >
              {subjects.length === 0 && <option value="">No subjects available</option>}
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              name="duration_min"
              type="number"
              min="1"
              max="1440"
              placeholder="Minutes"
              value={sessionDuration}
              onChange={e => setSessionDuration(e.target.value)}
              required
            />
            <input
              name="notes"
              placeholder="Notes (optional)"
              value={sessionNotes}
              onChange={e => setSessionNotes(e.target.value)}
            />
            <button type="submit" disabled={subjects.length === 0}>
              Log
            </button>
          </form>
        </section>

        {/* Habits Section */}
        <section id="habits-section">
          <h2>Today's Habits</h2>
          <div id="habits-list" className="list">
            {habits.length === 0 ? (
              <div className="empty">No habits yet. Add one below.</div>
            ) : (
              habits.map(h => {
                const isChecked = checkins.some(
                  c => c.habit_id === h.id && c.date === todayDate && c.completed
                );
                return (
                  <div key={h.id} className="habit-row">
                    <button
                      type="button"
                      className={`habit-toggle ${isChecked ? 'checked' : ''}`}
                      onClick={() => toggleCheckin(h.id)}
                      title={isChecked ? 'Uncheck' : 'Check'}
                    >
                      {isChecked ? '✓' : ''}
                    </button>
                    <span className={`habit-name ${isChecked ? 'checked' : ''}`}>
                      {h.icon ? h.icon + ' ' : ''}
                      {h.name}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <form id="habit-form" onSubmit={handleAddHabit}>
            <input
              name="name"
              placeholder="Habit name"
              value={habitName}
              onChange={e => setHabitName(e.target.value)}
              required
            />
            <input
              name="icon"
              placeholder="Tag or prefix (optional)"
              maxLength={4}
              value={habitIcon}
              onChange={e => setHabitIcon(e.target.value)}
            />
            <button type="submit">Add</button>
          </form>
        </section>

        {/* Summary Section */}
        <section id="summary-section">
          <h2>This Week</h2>
          <div id="summary">
            <div className="summary-group">
              <h3>Study</h3>
              {Object.keys(weekStudyTotals).length === 0 ? (
                <div className="empty">No study time logged this week.</div>
              ) : (
                Object.entries(weekStudyTotals).map(([name, min]) => (
                  <div key={name} className="item">
                    <span>{name}</span>
                    <span>{(min / 60).toFixed(1)}h</span>
                  </div>
                ))
              )}
            </div>
            <div className="summary-group">
              <h3>Habits</h3>
              {habits.length === 0 ? (
                <div className="empty">No habits yet.</div>
              ) : (
                habits.map(h => {
                  const done = habitWeekCounts[h.id] || 0;
                  const pct = Math.round((done / 7) * 100);
                  return (
                    <div key={h.id} className="item">
                      <span>
                        {h.icon ? h.icon + ' ' : ''}
                        {h.name}
                      </span>
                      <span>
                        {done}/7 ({pct}%)
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>

      <div
        id="toast"
        className={`toast ${toast.isError ? 'error' : ''} ${!toast.visible ? 'hidden' : ''}`}
        role="status"
        aria-live="polite"
      >
        {toast.message}
      </div>
    </>
  );
}
