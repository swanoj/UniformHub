# Firestore Schema Specification

## `/users/{uid}`
- `displayName`: string
- `email`: string
- `photoUrl`: string
- `onboarded`: boolean
- `school`: string
- `isAdmin`: boolean
- `isOver18`: boolean
- `termsAccepted`: { version: string, acceptedAt: timestamp }
- `savedPosts`: string[] (postIds)
- `createdAt`: timestamp
- `updatedAt`: timestamp

## `/posts/{postId}`
- `title`: string
- `description`: string
- `price`: number | string
- `originalPrice`: number | string
- `quantity`: number (1-3)
- `category`: string
- `condition`: string
- `size`: string
- `school`: string
- `suburb`: string
- `ownerId`: string
- `photoUrls`: string[]
- `status`: 'ACTIVE' | 'SOLD' | 'EXPIRED'
- `type`: 'FOR_SALE' | 'FREE' | 'WTB'
- `verifiedCondition`: string (AI Audit Result)
- `createdAt`: timestamp
- `updatedAt`: timestamp

## `/threads/{threadId}`
- `participants`: string[] (uid)
- `postId`: string
- `lastMessage`: string
- `updatedAt`: timestamp

## `/threads/{threadId}/messages/{messageId}`
- `senderId`: string
- `text`: string
- `createdAt`: timestamp

## `/reports/{reportId}`
- `postId`: string
- `reportedBy`: string (uid)
- `reporterEmail`: string
- `reason`: string
- `details`: string
- `createdAt`: timestamp

## `/mail/{mailId}`
- `to`: string[]
- `message`: { subject: string, text: string, html: string }
*(Collection used by Firebase Trigger Email translation)*
