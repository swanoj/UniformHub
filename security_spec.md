# Security Specification: UniformHub

## Data Invariants
1. A **User** profile can only be created/updated by the user themselves.
2. A **Post** must have a valid `ownerId` matching the creator's UID.
3. A **Thread** must involve the buyer and the seller of the referenced post. `participantIds` must contain exactly two UIDs.
4. A **Message** can only be sent by a participant in the parent thread.
5. A **Block** record can only be created by the `blockerId`.
6. A **Report** record can only be created by the `reporterId`.
7. Users cannot see posts from users they have blocked, or users who have blocked them (handled via client-side filtering in V0, but restricted by rules where possible).

## The "Dirty Dozen" Payloads (Red Team)

1. **Identity Spoofing**: Attempt to create a user profile for a different UID.
2. **Post Ownership Theft**: Attempt to update someone else's post.
3. **Ghost Post**: Create a post with a fake `ownerId`.
4. **Thread Hijacking**: Create a thread for a post where I am neither buyer nor seller.
5. **Unauthorized Message**: Sending a message to a thread I'm not part of.
6. **Privilege Escalation**: Adding an `isAdmin` field to a user profile.
7. **Relational Gap**: Creating a thread for a non-existent post.
8. **Invalid State Transition**: Marking someone else's post as SOLD.
9. **Spamming Reports**: Creating 1000 reports in a single burst (size/rate limit checks).
10. **Data Poisoning**: Injecting 1MB of garbage into the `description` field.
11. **Timestamp Manipulation**: Setting `createdAt` to a future date instead of `request.time`.
12. **Block Bypass**: Reading messages in a thread after being blocked (if block state is checked in rules).

## Test Runner (Conceptual Plan)
A test file `firestore.rules.test.ts` will verify these rejections.

(Note: Implementation of the test file and rules follows in next steps)
