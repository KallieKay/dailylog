export interface Subject {
  id: string;
  name: string;
  color?: string;
  goal_hours_per_week: number;
}

export interface Session {
  id: string;
  subject_id: string;
  duration_min: number;
  notes?: string;
  date: string; // YYYY-MM-DD
  created_at: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  active: boolean;
}

export interface Checkin {
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}
