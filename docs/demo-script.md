# Daily Flow: Project Demonstration Video Script

**Project Identifier**: `WTC-DPY46VVK`  
**Application Title**: Daily Flow (Study Habit Tracker & Social Circle)  
**Target Video Duration**: 4 – 5 Minutes  
**Audience**: Course Evaluators, Academic Instructors, and Peer Reviewers  

---

## Pre-Recording Checklist
Before starting your screen recording:
1. Open the application in full-screen or a clean 1080p browser window (`1920x1080`).
2. Make sure you have at least 2 subjects added (e.g. *Mathematics*, *Computer Science*) and 2 habits (e.g. *Morning Deep Work*, *Active Recall*).
3. Have a sample study photo, video clip, or PDF ready on your desktop to demonstrate the file upload.
4. Keep microphone clear, speak at an energetic, steady pace, and use smooth cursor movements.

---

## Detailed Step-by-Step Script

### Act 1: Introduction, Project Overview & Cloud Architecture Strategy (0:00 – 1:05)
* **Screen Action**: Start on the header showing the clean title **"Daily Flow"** and subtitle *"Study with rhythm. Track your habits. Grow every day."* Scroll smoothly through the clean landing layout while explaining the cloud foundations.
* **Voiceover / Spoken Script**:
  > *"Hello everyone! Today, I am proud to present **Daily Flow** (Project `WTC-DPY46VVK`).
  >
  > Solitary studying frequently leads to burnout and inconsistent routines. We built Daily Flow as the **'Instagram of study habits'**—a modern cloud-driven web application that unites rigorous personal habit tracking with real-time peer accountability across study circles.
  >
  > From the ground up, this project was architected around **cloud-first engineering strategies**, leveraging both **AWS** and **Google Cloud** serverless infrastructure:
  >
  > 1. **Serverless Compute (AWS Lambda & Cloud Run)**: Instead of maintaining expensive, idle server instances, our compute strategy relies on stateless serverless execution—scaling to zero when inactive and scaling instantly under traffic to remain strictly within Free Tier cost constraints.
  > 2. **Managed Cloud Databases (Google Cloud Firestore & AWS DynamoDB)**: Data persistence is built on a serverless NoSQL document model. It provides sub-second query latency and event-driven delta updates for student records, daily check-ins, and circle posts.
  > 3. **Cloud Identity & Access Management (Firebase Auth & AWS Cognito)**: User authentication uses OAuth 2.0 with cryptographic JWT token verification, providing federated Google login and seamless session persistence.
  > 4. **Real-Time Event Pub/Sub (AWS AppSync & Firestore Streams)**: We leverage cloud WebSocket streams to power our live 'Members in Study' presence room and community feed, pushing instantaneous updates across circle devices.
  > 5. **Media Storage (Amazon S3 Patterns)**: The architecture is structured for scalable multi-format media delivery—handling study space photos, focus video reels, and PDF lecture notes.
  >
  > Now, let's step through the application live to see these cloud strategies in action."*

---

### Act 2: Cloud Authentication & Instagram Study Profile (1:05 – 1:50)
* **Screen Action**:
  - Move cursor to the top-right header and click **"Sign in with Google"**.
  - Complete the login. Once authenticated, the **Instagram-style Profile Card** smoothly renders.
  - Hover over the avatar story-ring, handle `@username`, and bio.
  - Click **"Edit Profile"**, make a quick text edit in the bio, and save.
  - Highlight the **Weekly Analytics** card inside the profile, including the **Buddies** count and Study Buddy Circle connection metric.
* **Voiceover / Spoken Script**:
  > *"Let's begin by signing in. Our cloud authentication securely issues a verified user token that scopes all backend operations to this individual student.
  >
  > Once authenticated, users are greeted by an Instagram-inspired study profile card. Notice the gradient story-ring avatar, customized handle, and personal study bio, which can be modified directly in the app.
  >
  > Right in the profile stats, you can see how many **Study Buddies** you have connected with in your circle. Embedded directly below is our automated **Weekly Analytics engine**. Rather than static text, it dynamically computes:
  >
  > **'@{username} has achieved 78% of their study goals, 40% of their habit goals, and connected with 2 study buddies this week.'**
  >
  > This is calculated on the fly against user-defined subject targets and active habit opportunities, accompanied by visual progress meters for study goals, habit consistency, and your growing buddy network."*

---

### Act 3: Study Tracker & Full CRUD Operations (1:50 – 2:35)
* **Screen Action**:
  - Scroll down to the **Subjects** section.
  - Type a new subject: *"Physics"*, goal: *"6"* hrs/week, and click **"Add"**.
  - Click **"Edit"** on a subject, modify the hours, and click **"Save"**.
  - Click **"Delete"** on a subject to reveal the **Confirmation Modal** (*"Are you sure you want to delete... This action cannot be undone."*), click **"Cancel"** to demonstrate safety.
  - Scroll to **Today's Habits**. Check off a habit (show the checkmark transition and updated summary count).
  - Show that habits also support inline editing and deletion confirmation.
* **Voiceover / Spoken Script**:
  > *"Under the study tracker view, students manage their core academic goals. Daily Flow implements full CRUD operations across all entities.
  >
  > I can add academic subjects with weekly hour goals, or click 'Edit' to make inline adjustments. To safeguard student data, every deletion request triggers an in-app confirmation modal preventing accidental data loss.
  >
  > In the Habits section, one click marks daily routines like deep work or active recall. The 'This Week' summary instantly aggregates hours studied and habit completion rates, reinforcing positive routines through immediate visual feedback."*

---

### Act 4: Live Study Room & "Members in Study" Presence (2:35 – 3:30)
* **Screen Action**:
  - Scroll up to the green **Live Study Room** banner.
  - Click **"Start Study Session"**.
  - In the modal, select a subject (e.g. *Mathematics*) and enter a focus note: *"Chapter 4 problem set"*.
  - Click **"Go Live & Study"**.
  - Show the live running stopwatch timer (`00:00:01`, `00:00:02`...) and the active status banner.
  - Scroll down slightly to the **"Members in Study"** grid: point to your live card alongside fellow circle members. Click **"+ Add to Buddies"** on a studying peer to demonstrate instant buddy circle connection!
  - Click **"End & Log Session"**.
  - Show the toast message and immediately show the session appearing under **Today's Sessions**!
* **Voiceover / Spoken Script**:
  > *"Now for one of our standout cloud features: the **Live Study Room**.
  >
  > When a student sits down to work, they click 'Start Study Session', pick their subject, and set an optional focus goal. Clicking 'Go Live' starts a digital running stopwatch timer.
  >
  > Beneath the control panel is our real-time **'Members in Study'** section. Leveraging our cloud database's pub/sub stream, my active status is broadcast immediately to everyone in my study circle. Fellow students can see who is currently studying, what subject they are tackling, and how long they have been live.
  >
  > Notice the **'Add to Buddies'** button on each card: with one click, I can connect with any active peer and add them directly to my study circle!
  >
  > When I finish, I click 'End & Log Session'. Daily Flow calculates the focus duration, records it directly under Today's Sessions, and updates my profile analytics—eliminating manual logging entirely."*

---

### Act 5: Circle Feed, Video Reels & Study Document Sharing (3:30 – 4:20)
* **Screen Action**:
  - Click on the top navigation tab: **"Circle Feed & Reels"**.
  - Scroll through the feed showing a study photo, a video reel, and a document card.
  - Click the **Heart (Like)** button on a post to show the count increase and color toggle.
  - Click **"+ Create Post or Reel"**.
  - Toggle between **Photo**, **Video Reel**, and **Study Document**.
  - Select a file to demonstrate the **Live Upload Preview box**.
  - Type a short caption and click **"Share to Circle"**.
* **Voiceover / Spoken Script**:
  > *"Next, let's navigate to the **Circle Feed & Reels** tab. This is where community study culture thrives.
  >
  > Students can share three types of media:
  > 1. High-resolution study space photos,
  > 2. Short-form focus video reels with native video controls and reel badges,
  > 3. And downloadable study documents such as PDF cheat sheets and lecture summaries.
  >
  > The creator modal includes live media previews before publishing. Posts feature subject tags, interactive like counts with heart indicators, and author deletion rights—fostering peer accountability and collaborative learning."*

---

### Act 6: Cloud Security, Free Tier Strategy & Conclusion (4:20 – 4:50)
* **Screen Action**:
  - Return to the top of the app, showcasing the overall clean, responsive interface.
  - Highlight the zero-emoji clean typography and modern visual design.
* **Voiceover / Spoken Script**:
  > *"To summarize, Daily Flow showcases how cloud strategies can transform everyday student productivity:
  >
  > - **Declarative Security**: Hardened cloud security rules enforce strict owner isolation and schema validation on every mutation.
  > - **Offline-First Resilience**: Local optimistic updates ensure zero UI latency, queuing mutations when offline and syncing automatically with the cloud upon reconnection.
  > - **Cost Optimization**: By following AWS Lambda and Google Cloud serverless models, the entire platform runs scalably within Free Tier parameters with zero idle server overhead.
  >
  > Thank you for evaluating Daily Flow—study with rhythm, track your habits, and grow every day!"*

---

## Presenter Video Tips for High Scores
- **Pacing**: Speak at an enthusiastic, articulate pace. Avoid long silences while clicking.
- **Mouse Precision**: Move your cursor deliberately to each feature before clicking.
- **Demonstration Data**: Having realistic, clean data (e.g. *Linear Algebra*, *Data Structures*) creates an authentic, production-grade impression.
- **Audio Quality**: Record in a quiet room using a headset or dedicated microphone.
