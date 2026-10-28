export interface UserProfile {
  userId: string;
  email?: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  bio?: string;
  createdAt?: string;
}

export interface Subject {
  id: string;
  userId?: string;
  name: string;
  color?: string;
  goal_hours_per_week: number;
}

export interface Session {
  id: string;
  userId?: string;
  subject_id: string;
  duration_min: number;
  notes?: string;
  date: string; // YYYY-MM-DD
  created_at: string;
}

export interface Habit {
  id: string;
  userId?: string;
  name: string;
  icon: string;
  active: boolean;
}

export interface Checkin {
  habit_id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  updatedAt?: string;
}

export type PostMediaType = 'image' | 'video' | 'reel' | 'document';

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorUsername?: string;
  authorPhoto?: string;
  type: PostMediaType;
  mediaUrl: string;
  fileName?: string;
  caption?: string;
  subjectName?: string;
  likesCount: number;
  likedBy: string[];
  createdAt: string;
}
