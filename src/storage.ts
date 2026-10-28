import { Subject, Session, Habit, Checkin, Post } from './types';

const STORAGE_KEYS = {
  SUBJECTS: 'dailyflow_subjects',
  SESSIONS: 'dailyflow_sessions',
  HABITS: 'dailyflow_habits',
  CHECKINS: 'dailyflow_checkins',
  POSTS: 'dailyflow_posts',
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
    return [];
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
    return [];
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
};
