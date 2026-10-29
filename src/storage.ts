import { Subject, Session, Habit, Checkin, Post, ActiveStudySession, StudyBuddy } from './types';

const STORAGE_KEYS = {
  SUBJECTS: 'dailyflow_subjects',
  SESSIONS: 'dailyflow_sessions',
  HABITS: 'dailyflow_habits',
  CHECKINS: 'dailyflow_checkins',
  POSTS: 'dailyflow_posts',
  ACTIVE_SESSIONS: 'dailyflow_active_sessions',
  BUDDIES: 'dailyflow_buddies',
};

export function removeEmojis(str: string): string {
  if (!str) return '';
  return str.replace(/\p{Extended_Pictographic}/gu, '').trim();
}

export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today(): string {
  return formatDate(new Date());
}

export function getWeekDates(baseDate = new Date()): { from: string; to: string; days: string[] } {
  const now = new Date(baseDate);
  const dayOfWeek = now.getDay() || 7; // Monday = 1, Sunday = 7
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek - 1));

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(formatDate(d));
  }
  return {
    from: days[0],
    to: formatDate(now),
    days,
  };
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Mathematics', goal_hours_per_week: 10, color: '#2563eb' },
  { id: 'sub-2', name: 'Computer Science', goal_hours_per_week: 12, color: '#7c3aed' },
  { id: 'sub-3', name: 'Literature & Writing', goal_hours_per_week: 5, color: '#059669' },
];

const DEFAULT_HABITS: Habit[] = [
  { id: 'hab-1', name: 'Morning Deep Work', icon: '', active: true },
  { id: 'hab-2', name: 'Active Recall / Flashcards', icon: '', active: true },
  { id: 'hab-3', name: 'Read 20 Pages', icon: '', active: true },
];

const DEFAULT_POSTS: Post[] = [
  {
    id: 'post-sample-1',
    userId: 'user-sample-alex',
    authorName: 'Alex Rivera',
    authorUsername: 'alex_studies',
    authorPhoto: '',
    type: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
    caption: '3 hours of deep calculus problem solving this morning. Goal for the week is 12 hours.',
    subjectName: 'Mathematics',
    likesCount: 14,
    likedBy: [],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'post-sample-2',
    userId: 'user-sample-sam',
    authorName: 'Sam Chen',
    authorUsername: 'sam_codes',
    authorPhoto: '',
    type: 'document',
    mediaUrl: '',
    fileName: 'DataStructures_CheatSheet.pdf',
    caption: 'Sharing my compiled summary notes on Tree Traversals and Graph Search for anyone preparing for midterms.',
    subjectName: 'Computer Science',
    likesCount: 28,
    likedBy: [],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

const DEFAULT_ACTIVE_STUDY_SESSIONS: ActiveStudySession[] = [
  {
    userId: 'user-sample-elena',
    displayName: 'Elena Rostova',
    username: 'elena_phys',
    photoURL: '',
    subjectName: 'Physics & Thermodynamics',
    startedAt: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    notes: 'Problem sets & active recall',
  },
  {
    userId: 'user-sample-marcus',
    displayName: 'Marcus Vance',
    username: 'marcus_code',
    photoURL: '',
    subjectName: 'Computer Science',
    startedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    notes: 'Algorithms & LeetCode review',
  },
];

const DEFAULT_BUDDIES: StudyBuddy[] = [
  {
    id: 'user-sample-alex',
    userId: 'guest-user',
    buddyUserId: 'user-sample-alex',
    buddyName: 'Alex Rivera',
    buddyUsername: 'alex_studies',
    buddyPhotoURL: '',
    addedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'user-sample-elena',
    userId: 'guest-user',
    buddyUserId: 'user-sample-elena',
    buddyName: 'Elena Rostova',
    buddyUsername: 'elena_phys',
    buddyPhotoURL: '',
    addedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

function getDefaultSessions(): Session[] {
  const { days } = getWeekDates();
  const d0 = days[0] || today();
  const d1 = days[1] || today();
  const d2 = days[2] || today();
  const d3 = days[3] || today();

  return [
    {
      id: 'sess-def-1',
      userId: 'guest-user',
      subject_id: 'sub-2',
      duration_min: 360,
      notes: 'Distributed cloud systems and microservices architecture',
      date: d0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'sess-def-2',
      userId: 'guest-user',
      subject_id: 'sub-1',
      duration_min: 300,
      notes: 'Linear algebra, matrix proofs, and problem sets',
      date: d1,
      created_at: new Date().toISOString(),
    },
    {
      id: 'sess-def-3',
      userId: 'guest-user',
      subject_id: 'sub-3',
      duration_min: 240,
      notes: 'Technical research documentation and systems analysis',
      date: d2,
      created_at: new Date().toISOString(),
    },
    {
      id: 'sess-def-4',
      userId: 'guest-user',
      subject_id: 'sub-2',
      duration_min: 364,
      notes: 'DynamoDB data modeling and AWS Lambda event triggers',
      date: d3,
      created_at: new Date().toISOString(),
    },
  ];
}

function getDefaultCheckins(): Checkin[] {
  const { days } = getWeekDates();
  const d0 = days[0] || today();
  const d1 = days[1] || today();
  const d2 = days[2] || today();
  const d3 = days[3] || today();
  const d4 = days[4] || today();

  return [
    { habit_id: 'hab-1', date: d0, completed: true },
    { habit_id: 'hab-2', date: d0, completed: true },
    { habit_id: 'hab-1', date: d1, completed: true },
    { habit_id: 'hab-3', date: d1, completed: true },
    { habit_id: 'hab-2', date: d2, completed: true },
    { habit_id: 'hab-1', date: d3, completed: true },
    { habit_id: 'hab-3', date: d3, completed: true },
    { habit_id: 'hab-2', date: d4, completed: true },
  ];
}

export const storage = {
  getSubjects(): Subject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    this.saveSubjects(DEFAULT_SUBJECTS);
    return DEFAULT_SUBJECTS;
  },

  saveSubjects(subjects: Subject[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(subjects));
    } catch {
      // ignore
    }
  },

  updateSubject(id: string, updates: Partial<Subject>): Subject[] {
    const list = this.getSubjects().map(s => (s.id === id ? { ...s, ...updates } : s));
    this.saveSubjects(list);
    return list;
  },

  deleteSubject(id: string): Subject[] {
    const list = this.getSubjects().filter(s => s.id !== id);
    this.saveSubjects(list);
    return list;
  },

  getSessions(): Session[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    const def = getDefaultSessions();
    this.saveSessions(def);
    return def;
  },

  saveSessions(sessions: Session[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  },

  getHabits(): Habit[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HABITS);
      if (data) {
        const parsed: Habit[] = JSON.parse(data);
        return parsed.map(h => ({
          ...h,
          name: removeEmojis(h.name),
          icon: removeEmojis(h.icon || ''),
        }));
      }
    } catch {
      // fallback
    }
    this.saveHabits(DEFAULT_HABITS);
    return DEFAULT_HABITS;
  },

  saveHabits(habits: Habit[]): void {
    try {
      const cleaned = habits.map(h => ({
        ...h,
        name: removeEmojis(h.name),
        icon: removeEmojis(h.icon || ''),
      }));
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(cleaned));
    } catch {
      // ignore
    }
  },

  updateHabit(id: string, updates: Partial<Habit>): Habit[] {
    const list = this.getHabits().map(h => (h.id === id ? { ...h, ...updates } : h));
    this.saveHabits(list);
    return list;
  },

  deleteHabit(id: string): Habit[] {
    const list = this.getHabits().filter(h => h.id !== id);
    this.saveHabits(list);
    return list;
  },

  getCheckins(): Checkin[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHECKINS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    const def = getDefaultCheckins();
    this.saveCheckins(def);
    return def;
  },

  saveCheckins(checkins: Checkin[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(checkins));
    } catch {
      // ignore
    }
  },

  getPosts(): Post[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    this.savePosts(DEFAULT_POSTS);
    return DEFAULT_POSTS;
  },

  savePosts(posts: Post[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(posts));
    } catch {
      // ignore
    }
  },

  createPost(post: Omit<Post, 'id' | 'likesCount' | 'likedBy'>): Post[] {
    const newPost: Post = {
      ...post,
      id: 'post-' + Math.random().toString(36).substring(2, 9),
      likesCount: 0,
      likedBy: [],
    };
    const updated = [newPost, ...this.getPosts()];
    this.savePosts(updated);
    return updated;
  },

  toggleLikePost(postId: string, userId: string): Post[] {
    const list = this.getPosts().map(p => {
      if (p.id !== postId) return p;
      const already = p.likedBy.includes(userId);
      const newLikedBy = already ? p.likedBy.filter(u => u !== userId) : [...p.likedBy, userId];
      return {
        ...p,
        likedBy: newLikedBy,
        likesCount: newLikedBy.length,
      };
    });
    this.savePosts(list);
    return list;
  },

  deletePost(postId: string): Post[] {
    const list = this.getPosts().filter(p => p.id !== postId);
    this.savePosts(list);
    return list;
  },

  getActiveStudySessions(): ActiveStudySession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSIONS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return DEFAULT_ACTIVE_STUDY_SESSIONS;
  },

  saveActiveStudySessions(sessions: ActiveStudySession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSIONS, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  },

  startActiveStudySession(session: ActiveStudySession): ActiveStudySession[] {
    const list = this.getActiveStudySessions().filter(s => s.userId !== session.userId);
    const updated = [session, ...list];
    this.saveActiveStudySessions(updated);
    return updated;
  },

  stopActiveStudySession(userId: string): ActiveStudySession[] {
    const list = this.getActiveStudySessions().filter(s => s.userId !== userId);
    this.saveActiveStudySessions(list);
    return list;
  },

  getBuddies(): StudyBuddy[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BUDDIES);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    this.saveBuddies(DEFAULT_BUDDIES);
    return DEFAULT_BUDDIES;
  },

  saveBuddies(buddies: StudyBuddy[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDDIES, JSON.stringify(buddies));
    } catch {
      // ignore
    }
  },

  addBuddy(buddy: { buddyUserId: string; buddyName: string; buddyUsername?: string; buddyPhotoURL?: string }): StudyBuddy[] {
    const existing = this.getBuddies();
    if (existing.some(b => b.buddyUserId === buddy.buddyUserId)) return existing;
    const newBuddy: StudyBuddy = {
      id: buddy.buddyUserId,
      userId: 'guest-user',
      buddyUserId: buddy.buddyUserId,
      buddyName: removeEmojis(buddy.buddyName),
      buddyUsername: removeEmojis(buddy.buddyUsername || ''),
      buddyPhotoURL: buddy.buddyPhotoURL || '',
      addedAt: new Date().toISOString(),
    };
    const updated = [newBuddy, ...existing];
    this.saveBuddies(updated);
    return updated;
  },

  removeBuddy(buddyUserId: string): StudyBuddy[] {
    const updated = this.getBuddies().filter(b => b.buddyUserId !== buddyUserId);
    this.saveBuddies(updated);
    return updated;
  },
};
