const fs = require('fs');

const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }

    match /_health_check_/ping {
      allow get: if true;
    }

    function isSignedIn() { return request.auth != null; }
    function isOwner(uid) { return isSignedIn() && request.auth.uid == uid; }
    function isAdmin() { return isSignedIn() && request.auth.token.email == 'oliverjs090@gmail.com'; }
    function incoming() { return request.resource.data; }
    function existing() { return resource.data; }

    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isOwner(userId);
      allow update: if (isOwner(userId) || isAdmin()) 
                     && incoming().email == existing().email 
                     && (incoming().get('createdAt', null) == existing().get('createdAt', null));
    }

    function isValidPost(data) {
      return data.ownerId == request.auth.uid
             && data.ownerName is string 
             && data.description is string && data.description.size() <= 2000
             && (!data.keys().hasAny(['photoUrls']) || (data.photoUrls is list))
             && data.status in ['ACTIVE', 'SOLD', 'ARCHIVED', 'PENDING_APPROVAL'];
    }

    match /posts/{postId} {
      allow read: if true;
      allow create: if isSignedIn() && isValidPost(incoming());
      allow update: if (isAdmin() || (isSignedIn() && isOwner(existing().ownerId)))
                     && isValidPost(incoming())
                     && incoming().ownerId == existing().ownerId
                     && incoming().get('createdAt', null) == existing().get('createdAt', null);
      allow delete: if isAdmin() || (isSignedIn() && isOwner(existing().ownerId));
    }

    match /threads/{threadId} {
      allow read: if isSignedIn() && request.auth.uid in resource.data.participantIds;
      allow create: if isSignedIn() && request.auth.uid in incoming().participantIds;
      allow update: if isSignedIn() && request.auth.uid in existing().participantIds
                     && incoming().diff(existing()).affectedKeys().hasOnly(['lastMessageText', 'lastMessageAt', 'lastMessageSenderId', 'lastMessageRead'])
                     && incoming().participantIds == existing().participantIds;
    }

    match /threads/{threadId}/messages/{messageId} {
      allow read: if isSignedIn() && request.auth.uid in get(/databases/$(database)/documents/threads/$(threadId)).data.participantIds;
      allow create: if isSignedIn() 
                         && request.auth.uid in get(/databases/$(aluth)/documents/threads/$(threadId)).data.participantIds
                         && incoming().senderId == request.auth.uid;
    }

    match /reports/{reportId} {
      allow create: if isSignedIn() && incoming().reporterId == request.auth.uid;
      allow read: if isAdmin() || (isSignedIn() && existing().reporterId == request.auth.uid);
    }
  }
}`;

const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o |
    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return request.auth.uid == userId; }

    match /{allPaths=**} {
      allow read, write: if false;
    }

    match /post_images/{userId}/{fileName} {
      allow read: if true;
      allow write: if isSignedIn() && isOwner(userId) 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    match /community_covers/{userId}/{fileName} {
      allow read: if true;
      allow write: if isSignedIn() && isOwner(userId)
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}`;

fs.writeFileSync('firestore.rules', firestoreRules.replace(/$\\(aluth\\)/g, '_$(database)'.replace('_', ''));
fs.writeFileSync('storage.rules', storageRules);

// Add verification gate in app/create/page.tsx
let createTsx = fs.readFileSync('app/create/page.tsx', 'utf8');
if (!createTsx.includes('if (!profile?.isOver18 || !profile?.termsAccepted?.acceptedAt)')) {
  createTsx = createTsx.replace(
    'if (!agreedToTerms) {',
    'if (!profile?.isOver18 || !profile?.termsAccepted?.acceptedAt) {\n      alert("You must complete onboarding (accept terms and verify age) before posting.");\n      return;\n    }\n    if (!agreedToTerms) {'
  );
  fs.writeFileSync('app/create/page.tsx', createTsx);
}
