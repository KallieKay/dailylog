# Security Specification: Daily Flow (Study & Habit Tracker)

## 1. Data Invariants
- Each user profile `/users/{userId}` belongs strictly to the authenticated user matching `userId == request.auth.uid`.
- Subcollections (`subjects`, `sessions`, `habits`, `checkins`) reside under `/users/{userId}/...` and can only be read, created, updated, or deleted by the document owner `request.auth.uid == userId`.
- All writes must pass strict property-type, size, and regex ID boundary checks (`isValidId`).
- ID and ownership keys (`id`, `userId`, `habit_id`) are immutable across updates.
- Duration for study sessions must be an integer between 1 and 1440 minutes.

## 2. The "Dirty Dozen" Threat Payloads
1. **Unauthenticated Read of User Profiles**: Anonymous request to `/users/alice` -> REJECTED (auth required).
2. **Unauthenticated Read of Private Habits**: Anonymous request to `/users/alice/habits/h1` -> REJECTED.
3. **Cross-User Subject Creation**: User `bob` attempts to create subject at `/users/alice/subjects/s1` -> REJECTED (`isOwner(userId)` fails).
4. **Cross-User Session Querying**: User `bob` attempts to list sessions at `/users/alice/sessions` -> REJECTED.
5. **Cross-User Checkin Mutation**: User `bob` attempts to check in for `/users/alice/checkins/c1` -> REJECTED.
6. **Path Injection / Junk ID**: Attacker attempts doc ID with `/users/alice/habits/bad!@#$$%^&*` -> REJECTED (`isValidId` fails regex).
7. **Identity Spoofing in Profile**: User `bob` writes `{ userId: 'alice', displayName: 'Hacker' }` -> REJECTED (`data.userId == request.auth.uid` fails).
8. **Owner Mutation on Update**: User tries to change `userId` or `id` during update -> REJECTED (`incoming().userId == existing().userId` fails).
9. **Negative or Absurd Duration**: User tries to log session with `duration_min: -40` or `1000000` -> REJECTED (`duration_min > 0 && duration_min <= 1440` fails).
10. **Payload Flooding / Denial of Wallet**: Attacker sends 1MB string in `name` or `notes` -> REJECTED (`size() <= 100` / `size() <= 500` fails).
11. **Arbitrary Collection Root Writing**: Attacker writes to `/admin_secrets/doc1` -> REJECTED (global default-deny catch-all).
12. **Profile Deletion Attack**: Malicious script attempts `delete` on `/users/{userId}` -> REJECTED (`allow delete: if false`).

## 3. Test Runner Invariant Summary
- All tests verify that read/write requests without matching `request.auth.uid == userId` or failing validation schemas return `PERMISSION_DENIED`.
