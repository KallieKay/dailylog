import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, Subject, Session, Habit, Checkin, Post } from './types';
import { removeEmojis } from './storage';

// Profile management
export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const path = `users/${user.uid}`;
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    const defaultUsername = (user.email ? user.email.split('@')[0] : 'study_' + user.uid.substring(0, 5))
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);

    const profile: UserProfile = {
      userId: user.uid,
      email: user.email || '',
      displayName: removeEmojis(user.displayName || 'Flow Scholar'),
      username: defaultUsername || 'scholar',
      photoURL: user.photoURL || '',
      bio: 'Documenting daily study flow & habit streaks',
      createdAt: new Date().toISOString(),
    };

    await setDoc(userRef, profile);
    return profile;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
  const path = `users/${userId}`;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

// Subscriptions & mutations with defensive error handling
export function subscribeSubjects(userId: string, onUpdate: (subjects: Subject[]) => void): Unsubscribe {
  const path = `users/${userId}/subjects`;
  const q = query(collection(db, 'users', userId, 'subjects'));
  return onSnapshot(
    q,
    snapshot => {
      const items: Subject[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as Subject);
      });
      onUpdate(items);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addSubjectDoc(userId: string, subject: Omit<Subject, 'id' | 'userId'>): Promise<Subject> {
  const id = 'sub-' + Math.random().toString(36).substring(2, 9);
  const path = `users/${userId}/subjects/${id}`;
  const data: Subject = {
    id,
    userId,
    name: removeEmojis(subject.name),
    color: subject.color || '#3b82f6',
    goal_hours_per_week: subject.goal_hours_per_week || 0,
  };
  try {
    await setDoc(doc(db, 'users', userId, 'subjects', id), data);
    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateSubjectDoc(
  userId: string,
  subjectId: string,
  updates: { name?: string; goal_hours_per_week?: number; color?: string }
): Promise<void> {
  const path = `users/${userId}/subjects/${subjectId}`;
  const dataToUpdate: Record<string, unknown> = {};
  if (updates.name !== undefined) dataToUpdate.name = removeEmojis(updates.name);
  if (updates.goal_hours_per_week !== undefined) dataToUpdate.goal_hours_per_week = updates.goal_hours_per_week;
  if (updates.color !== undefined) dataToUpdate.color = updates.color;

  try {
    await updateDoc(doc(db, 'users', userId, 'subjects', subjectId), dataToUpdate);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteSubjectDoc(userId: string, subjectId: string): Promise<void> {
  const path = `users/${userId}/subjects/${subjectId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'subjects', subjectId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeSessions(userId: string, onUpdate: (sessions: Session[]) => void): Unsubscribe {
  const path = `users/${userId}/sessions`;
  const q = query(collection(db, 'users', userId, 'sessions'));
  return onSnapshot(
    q,
    snapshot => {
      const items: Session[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as Session);
      });
      items.sort((a, b) => b.created_at.localeCompare(a.created_at));
      onUpdate(items);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addSessionDoc(
  userId: string,
  session: Omit<Session, 'id' | 'userId' | 'created_at'>
): Promise<Session> {
  const id = 'sess-' + Math.random().toString(36).substring(2, 9);
  const path = `users/${userId}/sessions/${id}`;
  const data: Session = {
    id,
    userId,
    subject_id: session.subject_id,
    duration_min: session.duration_min,
    notes: removeEmojis(session.notes || ''),
    date: session.date,
    created_at: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'users', userId, 'sessions', id), data);
    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export function subscribeHabits(userId: string, onUpdate: (habits: Habit[]) => void): Unsubscribe {
  const path = `users/${userId}/habits`;
  const q = query(collection(db, 'users', userId, 'habits'));
  return onSnapshot(
    q,
    snapshot => {
      const items: Habit[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as Habit);
      });
      onUpdate(items);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function addHabitDoc(userId: string, habit: Omit<Habit, 'id' | 'userId'>): Promise<Habit> {
  const id = 'hab-' + Math.random().toString(36).substring(2, 9);
  const path = `users/${userId}/habits/${id}`;
  const data: Habit = {
    id,
    userId,
    name: removeEmojis(habit.name),
    icon: removeEmojis(habit.icon || ''),
    active: habit.active ?? true,
  };
  try {
    await setDoc(doc(db, 'users', userId, 'habits', id), data);
    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function updateHabitDoc(
  userId: string,
  habitId: string,
  updates: { name?: string; icon?: string; active?: boolean }
): Promise<void> {
  const path = `users/${userId}/habits/${habitId}`;
  const dataToUpdate: Record<string, unknown> = {};
  if (updates.name !== undefined) dataToUpdate.name = removeEmojis(updates.name);
  if (updates.icon !== undefined) dataToUpdate.icon = removeEmojis(updates.icon);
  if (updates.active !== undefined) dataToUpdate.active = updates.active;

  try {
    await updateDoc(doc(db, 'users', userId, 'habits', habitId), dataToUpdate);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteHabitDoc(userId: string, habitId: string): Promise<void> {
  const path = `users/${userId}/habits/${habitId}`;
  try {
    await deleteDoc(doc(db, 'users', userId, 'habits', habitId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export function subscribeCheckins(userId: string, onUpdate: (checkins: Checkin[]) => void): Unsubscribe {
  const path = `users/${userId}/checkins`;
  const q = query(collection(db, 'users', userId, 'checkins'));
  return onSnapshot(
    q,
    snapshot => {
      const items: Checkin[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as Checkin);
      });
      onUpdate(items);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function setCheckinDoc(
  userId: string,
  habitId: string,
  date: string,
  completed: boolean
): Promise<void> {
  const checkinDocId = `${date}_${habitId}`;
  const path = `users/${userId}/checkins/${checkinDocId}`;
  const data: Checkin = {
    habit_id: habitId,
    userId,
    date,
    completed,
    updatedAt: new Date().toISOString(),
  };
  try {
    await setDoc(doc(db, 'users', userId, 'checkins', checkinDocId), data);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

// ================= CIRCLE FEED POSTS =================
export function subscribePosts(onUpdate: (posts: Post[]) => void): Unsubscribe {
  const path = 'posts';
  const q = query(collection(db, 'posts'));
  return onSnapshot(
    q,
    snapshot => {
      const items: Post[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as Post);
      });
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onUpdate(items);
    },
    error => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function createPostDoc(post: Omit<Post, 'id' | 'likesCount' | 'likedBy'>): Promise<Post> {
  const id = 'post-' + Math.random().toString(36).substring(2, 9);
  const path = `posts/${id}`;
  const data: Post = {
    ...post,
    id,
    caption: removeEmojis(post.caption || ''),
    fileName: removeEmojis(post.fileName || ''),
    subjectName: removeEmojis(post.subjectName || ''),
    authorName: removeEmojis(post.authorName),
    authorUsername: removeEmojis(post.authorUsername || ''),
    likesCount: 0,
    likedBy: [],
  };
  try {
    await setDoc(doc(db, 'posts', id), data);
    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function toggleLikePostDoc(postId: string, userId: string, currentLikedBy: string[]): Promise<void> {
  const path = `posts/${postId}`;
  const alreadyLiked = currentLikedBy.includes(userId);
  const newLikedBy = alreadyLiked
    ? currentLikedBy.filter(uid => uid !== userId)
    : [...currentLikedBy, userId];
  const newLikesCount = newLikedBy.length;

  try {
    await updateDoc(doc(db, 'posts', postId), {
      likedBy: newLikedBy,
      likesCount: newLikesCount,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deletePostDoc(postId: string): Promise<void> {
  const path = `posts/${postId}`;
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
