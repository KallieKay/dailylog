import React, { useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { Unsubscribe } from 'firebase/firestore';
import { auth, loginWithGoogle, logout } from './firebase';
import {
  ensureUserProfile,
  updateUserProfile,
  subscribeSubjects,
  addSubjectDoc,
  updateSubjectDoc,
  deleteSubjectDoc,
  subscribeSessions,
  addSessionDoc,
  subscribeHabits,
  addHabitDoc,
  updateHabitDoc,
  deleteHabitDoc,
  subscribeCheckins,
  setCheckinDoc,
  subscribePosts,
  createPostDoc,
  toggleLikePostDoc,
  deletePostDoc,
} from './firestoreService';
import { Subject, Session, Habit, Checkin, UserProfile, Post, PostMediaType } from './types';
import { storage, today, getWeekDates, removeEmojis } from './storage';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'tracker' | 'feed'>('tracker');

  // Profile Edit modal
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  // Main collections
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // Subject Edit state
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubGoal, setEditSubGoal] = useState('');

  // Habit Edit state
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editHabName, setEditHabName] = useState('');
  const [editHabIcon, setEditHabIcon] = useState('');

  // Deletion confirmation modal state
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'subject' | 'habit' | 'post';
    id: string;
    name: string;
  } | null>(null);

  // Create Post Modal State
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [postType, setPostType] = useState<PostMediaType>('image');
  const [postCaption, setPostCaption] = useState('');
  const [postSubject, setPostSubject] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postFileName, setPostFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Create Subject / Session / Habit Form states
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

  // Auth state listener & Realtime Subscriptions
  useEffect(() => {
    let unsubs: Unsubscribe[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, async currentUser => {
      setIsAuthLoading(false);
      setUser(currentUser);

      // Clean up previous subscriptions
      unsubs.forEach(fn => fn());
      unsubs = [];

      if (currentUser) {
        try {
          const userProf = await ensureUserProfile(currentUser);
          setProfile(userProf);
          setEditUsername(userProf.username || '');
          setEditBio(userProf.bio || '');

          // Attach realtime Firestore listeners for personal data
          unsubs.push(
            subscribeSubjects(currentUser.uid, firestoreSubjects => {
              setSubjects(firestoreSubjects);
            })
          );
          unsubs.push(
            subscribeSessions(currentUser.uid, firestoreSessions => {
              setSessions(firestoreSessions);
            })
          );
          unsubs.push(
            subscribeHabits(currentUser.uid, firestoreHabits => {
              setHabits(firestoreHabits);
            })
          );
          unsubs.push(
            subscribeCheckins(currentUser.uid, firestoreCheckins => {
              setCheckins(firestoreCheckins);
            })
          );
          // Circle feed listener
          unsubs.push(
            subscribePosts(firestorePosts => {
              setPosts(firestorePosts);
            })
          );
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          showToast('Failed to load cloud profile: ' + errMsg, true);
        }
      } else {
        // Logged out / guest fallback
        setProfile(null);
        setSubjects(storage.getSubjects());
        setSessions(storage.getSessions());
        setHabits(storage.getHabits());
        setCheckins(storage.getCheckins());
        setPosts(storage.getPosts());
      }
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach(fn => fn());
    };
  }, []);

  // Update session subject select default if subjects change
  useEffect(() => {
    if (subjects.length > 0 && (!sessionSubjectId || !subjects.some(s => s.id === sessionSubjectId))) {
      setSessionSubjectId(subjects[0].id);
    }
  }, [subjects, sessionSubjectId]);

  // Auth Handlers
  const handleGoogleLogin = async () => {
    try {
      showToast('Connecting to Google...');
      const loggedUser = await loginWithGoogle();
      showToast('Welcome, ' + (loggedUser.displayName || 'scholar') + '!');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast('Login canceled or failed: ' + errMsg, true);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast('Signed out');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast('Sign out error: ' + errMsg, true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    const cleanUsername = removeEmojis(editUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')).slice(0, 30);
    const cleanBio = removeEmojis(editBio.trim()).slice(0, 250);

    try {
      await updateUserProfile(user.uid, {
        username: cleanUsername,
        bio: cleanBio,
      });
      setProfile(prev => (prev ? { ...prev, username: cleanUsername, bio: cleanBio } : null));
      setIsEditingProfile(false);
      showToast('Profile updated');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      showToast('Failed to update profile: ' + errMsg, true);
    }
  };

  // ================= SUBJECT CRUD =================
  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = removeEmojis(subjectName.trim());
    if (!trimmed) return;
    const goal = parseFloat(subjectGoal) || 0;

    if (user) {
      try {
        await addSubjectDoc(user.uid, {
          name: trimmed,
          goal_hours_per_week: goal,
          color: '#3b82f6',
        });
        setSubjectName('');
        setSubjectGoal('');
        showToast('Subject added');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Error adding subject: ' + errMsg, true);
      }
    } else {
      const newSubject: Subject = {
        id: 'sub-' + Math.random().toString(36).substring(2, 9),
        name: trimmed,
        goal_hours_per_week: goal,
        color: '#3b82f6',
      };
      const updated = [...subjects, newSubject];
      setSubjects(updated);
      storage.saveSubjects(updated);
      setSubjectName('');
      setSubjectGoal('');
      showToast('Subject added');
    }
  };

  const startEditSubject = (s: Subject) => {
    setEditingSubjectId(s.id);
    setEditSubName(s.name);
    setEditSubGoal(String(s.goal_hours_per_week));
  };

  const handleSaveEditSubject = async (e: React.FormEvent, subjectId: string) => {
    e.preventDefault();
    const trimmed = removeEmojis(editSubName.trim());
    if (!trimmed) return;
    const goal = parseFloat(editSubGoal) || 0;

    if (user) {
      try {
        await updateSubjectDoc(user.uid, subjectId, {
          name: trimmed,
          goal_hours_per_week: goal,
        });
        setEditingSubjectId(null);
        showToast('Subject updated');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Error updating subject: ' + errMsg, true);
      }
    } else {
      const updated = storage.updateSubject(subjectId, {
        name: trimmed,
        goal_hours_per_week: goal,
      });
      setSubjects(updated);
      setEditingSubjectId(null);
      showToast('Subject updated');
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (user) {
      try {
        await deleteSubjectDoc(user.uid, subjectId);
        showToast('Subject deleted');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Error deleting subject: ' + errMsg, true);
      }
    } else {
      const updated = storage.deleteSubject(subjectId);
      setSubjects(updated);
      showToast('Subject deleted');
    }
  };

  // ================= HABIT CRUD =================
  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = removeEmojis(habitName.trim());
    if (!trimmed) return;
    const cleanIcon = removeEmojis(habitIcon.trim());

    if (user) {
      try {
        await addHabitDoc(user.uid, {
          name: trimmed,
          icon: cleanIcon,
          active: true,
        });
        setHabitName('');
        setHabitIcon('');
        showToast('Habit added');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Error adding habit: ' + errMsg, true);
      }
    } else {
      const newHabit: Habit = {
        id: 'hab-' + Math.random().toString(36).substring(2, 9),
        name: trimmed,
        icon: cleanIcon,
        active: true,
      };
      const updated = [...habits, newHabit];
      setHabits(updated);
      storage.saveHabits(updated);
      setHabitName('');
      setHabitIcon('');
      showToast('Habit added');
    }
  };

  const startEditHabit = (h: Habit) => {
    setEditingHabitId(h.id);
    setEditHabName(h.name);
    setEditHabIcon(h.icon || '');
  };

  const handleSaveEditHabit = async (e: React.FormEvent, habitId: string) => {
    e.preventDefault();
    const trimmed = removeEmojis(editHabName.trim());
    if (!trimmed) return;
    const cleanIcon = removeEmojis(editHabIcon.trim());

    if (user) {
      try {
        await updateHabitDoc(user.uid, habitId, {
          name: trimmed,
          icon: cleanIcon,
        });
        setEditingHabitId(null);
        showToast('Habit updated');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Error updating habit: ' + errMsg, true);
      }
    } else {
      const updated = storage.updateHabit(habitId, {
        name: trimmed,
        icon: cleanIcon,
      });
      setHabits(updated);
      setEditingHabitId(null);
      showToast('Habit updated');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (user) {
      try {
        await deleteHabitDoc(user.uid, habitId);
        showToast('Habit deleted');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Error deleting habit: ' + errMsg, true);
      }
    } else {
      const updated = storage.deleteHabit(habitId);
      setHabits(updated);
      showToast('Habit deleted');
    }
  };

  // ================= FEED POSTS CRUD =================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPostFileName(file.name);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPostMediaUrl(result);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
      showToast('Failed to read file', true);
    };

    reader.readAsDataURL(file);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postMediaUrl && postType !== 'document') {
      showToast('Please select a media file to upload', true);
      return;
    }

    const cleanCaption = removeEmojis(postCaption.trim());
    const authorName = user ? (profile?.displayName || user.displayName || 'Scholar') : 'Guest Scholar';
    const authorUsername = user ? (profile?.username || 'scholar') : 'guest';
    const authorPhoto = user ? (profile?.photoURL || '') : '';
    const userId = user ? user.uid : 'guest-user';

    const newPostData = {
      userId,
      authorName,
      authorUsername,
      authorPhoto,
      type: postType,
      mediaUrl: postMediaUrl,
      fileName: postFileName,
      caption: cleanCaption,
      subjectName: postSubject || undefined,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        await createPostDoc(newPostData);
        setIsCreatePostOpen(false);
        resetPostForm();
        showToast('Post shared with circle');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Error sharing post: ' + errMsg, true);
      }
    } else {
      const updated = storage.createPost(newPostData);
      setPosts(updated);
      setIsCreatePostOpen(false);
      resetPostForm();
      showToast('Post shared');
    }
  };

  const resetPostForm = () => {
    setPostCaption('');
    setPostMediaUrl('');
    setPostFileName('');
    setPostSubject('');
    setPostType('image');
  };

  const handleToggleLike = async (post: Post) => {
    const currentUserId = user ? user.uid : 'guest-user';
    if (user) {
      try {
        await toggleLikePostDoc(post.id, currentUserId, post.likedBy || []);
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Failed to like post: ' + errMsg, true);
      }
    } else {
      const updated = storage.toggleLikePost(post.id, currentUserId);
      setPosts(updated);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (user) {
      try {
        await deletePostDoc(postId);
        showToast('Post removed');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Error removing post: ' + errMsg, true);
      }
    } else {
      const updated = storage.deletePost(postId);
      setPosts(updated);
      showToast('Post removed');
    }
  };

  // Confirm delete modal execution
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;
    setItemToDelete(null);

    if (type === 'subject') {
      await handleDeleteSubject(id);
    } else if (type === 'habit') {
      await handleDeleteHabit(id);
    } else if (type === 'post') {
      await handleDeletePost(id);
    }
  };

  const toggleCheckin = async (habitId: string) => {
    const todayDate = today();
    const existing = checkins.find(c => c.habit_id === habitId && c.date === todayDate);
    const newState = !(existing && existing.completed);

    if (user) {
      try {
        await setCheckinDoc(user.uid, habitId, todayDate, newState);
        showToast(newState ? 'Checked in' : 'Unchecked');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Error updating checkin: ' + errMsg, true);
      }
    } else {
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
    }
  };

  // ================= SESSIONS =================
  const handleLogSession = async (e: React.FormEvent) => {
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
    const cleanNotes = removeEmojis(sessionNotes.trim());

    if (user) {
      try {
        await addSessionDoc(user.uid, {
          subject_id: sessionSubjectId,
          duration_min: mins,
          notes: cleanNotes,
          date: todayDate,
        });
        setSessionDuration('');
        setSessionNotes('');
        showToast('Session logged');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        showToast('Error logging session: ' + errMsg, true);
      }
    } else {
      const newSession: Session = {
        id: 'sess-' + Math.random().toString(36).substring(2, 9),
        subject_id: sessionSubjectId,
        duration_min: mins,
        notes: cleanNotes,
        date: todayDate,
        created_at: new Date().toISOString(),
      };
      const updated = [newSession, ...sessions];
      setSessions(updated);
      storage.saveSessions(updated);
      setSessionDuration('');
      setSessionNotes('');
      showToast('Session logged');
    }
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

  const totalWeekMins = Object.values(weekStudyTotals).reduce((a, b) => a + b, 0);

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

  const userInitial = profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : 'S';

  const formatTimeAgo = (isoDate: string) => {
    try {
      const diffMs = Date.now() - new Date(isoDate).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <>
      <header>
        <div className="header-top">
          <div>
            <h1>Daily Flow</h1>
            <p className="subtitle">Study with rhythm. Track your habits. Grow every day.</p>
          </div>

          <div className="auth-box">
            {isAuthLoading ? (
              <span className="profile-name">Connecting...</span>
            ) : user ? (
              <button type="button" className="btn-secondary" onClick={handleLogout}>
                Sign Out
              </button>
            ) : (
              <button type="button" className="google-btn" onClick={handleGoogleLogin}>
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Sign in with Google
              </button>
            )}
          </div>
        </div>

        {/* Instagram-style Profile Header if logged in */}
        {user && profile && (
          <div className="profile-card">
            <div className="avatar-ring">
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} className="avatar-img" />
              ) : (
                <div className="avatar-img">{userInitial}</div>
              )}
            </div>

            <div className="profile-meta">
              <div className="profile-handle-row">
                <span className="profile-username">@{profile.username || 'scholar'}</span>
                <span className="profile-name">• {profile.displayName}</span>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditingProfile(true)}
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}
                >
                  Edit Profile
                </button>
              </div>

              <p className="profile-bio">{profile.bio}</p>

              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-num">{sessions.length}</span>
                  <span className="stat-label">Sessions</span>
                </div>
                <div className="stat-item">
                  <span className="stat-num">{habits.length}</span>
                  <span className="stat-label">Habits</span>
                </div>
                <div className="stat-item">
                  <span className="stat-num">{(totalWeekMins / 60).toFixed(1)}h</span>
                  <span className="stat-label">This Week</span>
                </div>
                <div className="stat-item">
                  <span className="stat-num">{posts.filter(p => p.userId === user.uid).length}</span>
                  <span className="stat-label">Posts</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guest Mode Banner */}
        {!user && !isAuthLoading && (
          <div className="auth-banner">
            <span className="auth-banner-text">
              Sign in with Google to create your Instagram study profile, share reels and study documents with your circle, and sync across devices.
            </span>
            <button type="button" className="google-btn" onClick={handleGoogleLogin}>
              Login to Sync
            </button>
          </div>
        )}
      </header>

      <main>
        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracker')}
          >
            My Study Tracker
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            Circle Feed & Reels ({posts.length})
          </button>
        </div>

        {/* TAB 1: TRACKER */}
        {activeTab === 'tracker' && (
          <>
            {/* Subjects Section with full CRUD */}
            <section id="subjects-section">
              <h2>Subjects</h2>
              <div id="subjects-list" className="list">
                {subjects.length === 0 ? (
                  <div className="empty">No subjects yet.</div>
                ) : (
                  subjects.map(s => {
                    const isEditing = editingSubjectId === s.id;
                    return (
                      <div key={s.id} className="item">
                        {isEditing ? (
                          <form
                            onSubmit={e => handleSaveEditSubject(e, s.id)}
                            className="edit-row"
                          >
                            <input
                              value={editSubName}
                              onChange={e => setEditSubName(e.target.value)}
                              placeholder="Subject name"
                              required
                              style={{ flex: '2', minWidth: '120px' }}
                            />
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={editSubGoal}
                              onChange={e => setEditSubGoal(e.target.value)}
                              placeholder="Goal hrs/week"
                              style={{ flex: '1', minWidth: '90px' }}
                            />
                            <button type="submit">Save</button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setEditingSubjectId(null)}
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <>
                            <div className="item-content">
                              <span style={{ fontWeight: 600 }}>{s.name}</span>
                            </div>
                            <div className="item-right">
                              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                                {s.goal_hours_per_week}h / week
                              </span>
                              <div className="item-actions">
                                <button
                                  type="button"
                                  className="btn-icon-text"
                                  onClick={() => startEditSubject(s)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-text danger"
                                  onClick={() => setItemToDelete({ type: 'subject', id: s.id, name: s.name })}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
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
                        <div className="item-content">
                          <span>
                            {name}
                            {notes}
                          </span>
                        </div>
                        <div className="item-right">
                          <span>{s.duration_min} min</span>
                        </div>
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

            {/* Habits Section with full CRUD */}
            <section id="habits-section">
              <h2>Today's Habits</h2>
              <div id="habits-list" className="list">
                {habits.length === 0 ? (
                  <div className="empty">No habits yet. Add one below.</div>
                ) : (
                  habits.map(h => {
                    const isEditing = editingHabitId === h.id;
                    const isChecked = checkins.some(
                      c => c.habit_id === h.id && c.date === todayDate && c.completed
                    );

                    if (isEditing) {
                      return (
                        <div key={h.id} className="habit-row">
                          <form
                            onSubmit={e => handleSaveEditHabit(e, h.id)}
                            className="edit-row"
                          >
                            <input
                              value={editHabName}
                              onChange={e => setEditHabName(e.target.value)}
                              placeholder="Habit name"
                              required
                              style={{ flex: '2', minWidth: '130px' }}
                            />
                            <input
                              value={editHabIcon}
                              onChange={e => setEditHabIcon(e.target.value)}
                              placeholder="Tag or prefix"
                              maxLength={4}
                              style={{ flex: '1', minWidth: '80px' }}
                            />
                            <button type="submit">Save</button>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setEditingHabitId(null)}
                            >
                              Cancel
                            </button>
                          </form>
                        </div>
                      );
                    }

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
                        <div className="item-actions">
                          <button
                            type="button"
                            className="btn-icon-text"
                            onClick={() => startEditHabit(h)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-icon-text danger"
                            onClick={() => setItemToDelete({ type: 'habit', id: h.id, name: h.name })}
                          >
                            Delete
                          </button>
                        </div>
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
          </>
        )}

        {/* TAB 2: INSTAGRAM-STYLE CIRCLE FEED & REELS */}
        {activeTab === 'feed' && (
          <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
            <div className="feed-header-bar">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--fg)', textTransform: 'none' }}>
                  Study Circle Feed
                </h2>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                  Photos, video reels, and study notes shared across your circle
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePostOpen(true)}
                style={{ padding: '0.6rem 1.2rem', borderRadius: '999px' }}
              >
                + Create Post or Reel
              </button>
            </div>

            {posts.length === 0 ? (
              <div className="empty" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                No posts shared in the circle yet. Be the first to post a study photo, reel, or document!
              </div>
            ) : (
              posts.map(post => {
                const currentUserId = user ? user.uid : 'guest-user';
                const isLiked = post.likedBy?.includes(currentUserId);
                const isAuthor = user ? post.userId === user.uid : true;

                return (
                  <article key={post.id} className="post-card">
                    {/* Post Header */}
                    <div className="post-header">
                      <div className="post-author">
                        <div className="author-ring-sm">
                          {post.authorPhoto ? (
                            <img src={post.authorPhoto} alt={post.authorName} className="author-avatar-sm" />
                          ) : (
                            <div className="author-avatar-sm">
                              {post.authorName ? post.authorName.charAt(0).toUpperCase() : 'S'}
                            </div>
                          )}
                        </div>
                        <div className="author-names">
                          <span className="author-handle">
                            @{post.authorUsername || 'scholar'}
                          </span>
                          <span className="author-display">
                            {post.authorName} • {formatTimeAgo(post.createdAt)}
                          </span>
                        </div>
                      </div>

                      {isAuthor && (
                        <button
                          type="button"
                          className="btn-icon-text danger"
                          onClick={() => setItemToDelete({ type: 'post', id: post.id, name: (post.caption || 'Post').slice(0, 20) })}
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Post Media Display */}
                    <div className="post-media-box">
                      {post.type === 'image' && post.mediaUrl && (
                        <img src={post.mediaUrl} alt={post.caption} className="post-media-img" />
                      )}

                      {(post.type === 'video' || post.type === 'reel') && post.mediaUrl && (
                        <>
                          <video
                            src={post.mediaUrl}
                            controls
                            playsInline
                            className="post-media-video"
                          />
                          {post.type === 'reel' && <span className="reel-badge">Reel</span>}
                        </>
                      )}

                      {post.type === 'document' && (
                        <div className="post-media-doc">
                          <svg className="doc-icon-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="doc-filename">{post.fileName || 'Study Document'}</span>
                          {post.mediaUrl && (
                            <a
                              href={post.mediaUrl}
                              download={post.fileName || 'study-document'}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-secondary"
                              style={{ textDecoration: 'none', display: 'inline-block', marginTop: '0.4rem' }}
                            >
                              Download / View Document
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Post Content & Interaction */}
                    <div className="post-content-body">
                      <div className="post-actions-bar">
                        <button
                          type="button"
                          className={`like-btn ${isLiked ? 'liked' : ''}`}
                          onClick={() => handleToggleLike(post)}
                        >
                          <svg className="like-icon" viewBox="0 0 24 24" fill={isLiked ? '#ef4444' : 'none'} stroke={isLiked ? '#ef4444' : 'currentColor'} strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span>{post.likesCount || 0} {post.likesCount === 1 ? 'like' : 'likes'}</span>
                        </button>

                        {post.subjectName && (
                          <span className="subject-badge">{post.subjectName}</span>
                        )}
                      </div>

                      {post.caption && (
                        <p className="post-caption">
                          <span className="post-caption-author">@{post.authorUsername || 'scholar'}</span>
                          {post.caption}
                        </p>
                      )}

                      <span className="post-time">{formatTimeAgo(post.createdAt)}</span>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Create Post / Reel / Doc Modal */}
      {isCreatePostOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreatePostOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <h3>Share with Your Circle</h3>

            {/* Media Type Pills */}
            <div className="media-type-pills">
              <button
                type="button"
                className={`type-pill ${postType === 'image' ? 'active' : ''}`}
                onClick={() => { setPostType('image'); setPostMediaUrl(''); setPostFileName(''); }}
              >
                Photo
              </button>
              <button
                type="button"
                className={`type-pill ${postType === 'reel' ? 'active' : ''}`}
                onClick={() => { setPostType('reel'); setPostMediaUrl(''); setPostFileName(''); }}
              >
                Video Reel
              </button>
              <button
                type="button"
                className={`type-pill ${postType === 'document' ? 'active' : ''}`}
                onClick={() => { setPostType('document'); setPostMediaUrl(''); setPostFileName(''); }}
              >
                Study Document
              </button>
            </div>

            <form onSubmit={handleCreatePost}>
              {/* File Upload input */}
              <div className="form-group">
                <label>
                  {postType === 'image'
                    ? 'Upload Study Photo'
                    : postType === 'reel'
                    ? 'Upload Video / Reel Clip'
                    : 'Upload Study Document (PDF, Notes, Doc)'}
                </label>
                <input
                  type="file"
                  accept={
                    postType === 'image'
                      ? 'image/*'
                      : postType === 'reel'
                      ? 'video/*'
                      : '.pdf,.doc,.docx,.txt,.csv,.pptx,text/*,application/*'
                  }
                  onChange={handleFileUpload}
                  required={!postMediaUrl}
                />

                {isUploading && <p style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>Processing file...</p>}

                {/* Live Preview */}
                {postMediaUrl && (
                  <div className="upload-preview-box">
                    {postType === 'image' && (
                      <img src={postMediaUrl} alt="Preview" style={{ maxHeight: '180px', objectFit: 'contain' }} />
                    )}
                    {postType === 'reel' && (
                      <video src={postMediaUrl} controls style={{ maxHeight: '180px', width: '100%' }} />
                    )}
                    {postType === 'document' && (
                      <div style={{ padding: '1rem', color: '#ffffff', textAlign: 'center', fontSize: '0.9rem' }}>
                        Selected File: <strong>{postFileName}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Caption */}
              <div className="form-group">
                <label>Caption & Study Notes</label>
                <textarea
                  value={postCaption}
                  onChange={e => setPostCaption(e.target.value)}
                  placeholder="Share what you studied, breakthrough insights, or notes..."
                  rows={3}
                  required
                />
              </div>

              {/* Subject Tag (optional) */}
              <div className="form-group">
                <label>Associated Subject (Optional)</label>
                <select
                  value={postSubject}
                  onChange={e => setPostSubject(e.target.value)}
                >
                  <option value="">No subject tag</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreatePostOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isUploading || (!postMediaUrl && postType !== 'document')}>
                  Share to Circle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Deletion */}
      {itemToDelete && (
        <div className="modal-backdrop" onClick={() => setItemToDelete(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Confirm Deletion</h3>
            <p className="modal-desc">
              Are you sure you want to delete the {itemToDelete.type} "{itemToDelete.name}"? This action cannot be undone.
            </p>
            <div className="modal-buttons">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setItemToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmDelete}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditingProfile && profile && (
        <div className="modal-backdrop" onClick={() => setIsEditingProfile(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h3>Edit Study Profile</h3>
            <form onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>Username</label>
                <input
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  placeholder="scholar_handle"
                  required
                />
              </div>
              <div className="form-group">
                <label>Study Bio</label>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="Documenting daily study flow & habit streaks..."
                  rows={3}
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsEditingProfile(false)}
                >
                  Cancel
                </button>
                <button type="submit">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
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
