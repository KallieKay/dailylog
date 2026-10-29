# Daily Flow

WTC-DPY46VVK

The "Instagram" of daily study habits and routines. Daily Flow is a cloud-driven, collaborative study tracking and social circle platform built with React, TypeScript, Vite, and Cloud Firestore.

## Overview

Daily Flow brings social accountability and rhythm to academic and personal growth. It combines personal habit tracking and study session logging with an Instagram-inspired circle feed, real-time "Members in Study" live room presence, automated weekly profile analytics, and multi-format study document and reel sharing.

## Key Features

### 1. Cloud Authentication & Instagram-Style Profile
- **Google OAuth Login**: Cloud-based authentication with session persistence.
- **Study Profile**: Instagram-inspired profile card featuring a gradient story ring avatar, custom handle (`@username`), display name, and study bio.
- **Profile Customization**: In-app profile editor to customize public handles and bio descriptions.

### 2. Automated Profile Analytics
- **Dynamic Percentage Calculations**: Real-time automated analytics tracking your weekly consistency:
  > *"@{username} has achieved 78% of their study goals and 40% of their habit goals this week."*
- **Dual Visual Progress Meters**: Visual progress bars tracking logged study hours against target hours, and completed habit check-ins against weekly opportunities.
- **Pace Intelligence**: Real-time pace indicator (*Ahead of Pace* / *In Progress*) comparing progress against the elapsed days of the week.

### 3. Live Study Session & "Members in Study" Presence
- **Go Live & Focus**: Start an active study session with an associated subject and optional focus goal.
- **Digital Stopwatch Timer**: Live running timer (`HH:MM:SS`) tracking your active study duration.
- **Members in Study Section**: Real-time circle presence grid displaying all members who are currently studying live, complete with avatar pulse indicators, subject badges, and start times.
- **Automatic Session Logging**: Ending a live session automatically computes the focus duration, records it directly under **Today's Sessions**, and updates your weekly analytics.

### 4. Full CRUD Management
- **Subjects CRUD**: Create, read, edit (inline), and delete academic and skill subjects with weekly hour targets.
- **Habits CRUD**: Create, read, edit (inline), and delete daily habits with custom tags.
- **Deletion Safety Confirmation**: In-app confirmation dialogs protecting against accidental deletions.
- **Daily Habit Check-Ins**: Interactive toggle check-ins with 7-day completion percentages.

### 5. Circle Feed, Video Reels & Study Documents
- **Multi-Format Sharing**: Upload and share study space photos, short-form video reels, or study documents (`.pdf`, `.doc`, `.txt`, `.csv`).
- **Live Upload Preview**: Real-time file reader preview for images, video playback, and document metadata before posting.
- **Social Engagement**: Interactive like counts with heart indicators and subject category badges.
- **Author Management**: Authors can delete their own posts with confirmation prompts.

### 6. Cloud-Native Architecture & Offline-First Sync
- **Serverless Cloud Persistence**: All user profiles, subjects, sessions, habits, posts, and live sessions are stored in Cloud Firestore.
- **Bidirectional Offline Sync**: Optimistic local updates ensure instant UI responsiveness; mutations queue offline and sync with the cloud backend automatically.
- **Cloud Security Rules**: Hardened declarative rules (`firestore.rules`) enforcing owner authorization (`request.auth.uid == userId`) and payload validation.

## Cloud Architecture Mapping

| Component | Implementation | AWS Cloud Architecture Equivalent |
| :--- | :--- | :--- |
| **Authentication & IAM** | Firebase Auth (Google OAuth) | **AWS Cognito User Pools** |
| **Serverless Database** | Cloud Firestore | **AWS DynamoDB** |
| **Real-Time Live Presence** | Firestore `onSnapshot` Streams | **AWS AppSync / WebSockets** |
| **Feed & Media Sharing** | Cloud-synced Collections | **AWS S3 + DynamoDB Metadata** |
| **Security & Access Control** | Firestore Security Rules | **AWS IAM & DynamoDB Fine-Grained Access Control** |

## Tech Stack

- **Frontend**: React 18 (Functional Components, Hooks)
- **Language**: TypeScript 5.6
- **Build Tool**: Vite 5.4
- **Backend / Cloud Services**: Google Cloud Firestore & Firebase Auth
- **Styling**: Modern CSS3 Custom Properties, Responsive Flexbox/Grid, and Gradient Story-Ring Accents
- **Design Discipline**: Strict zero-emoji policy with clean typography and modern SVG icons

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run local development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```
