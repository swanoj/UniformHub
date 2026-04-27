const fs = require('fs');

const fRule = `rules_version = '2';
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
                         && request.auth.uid in get(/databases/$(database)/documents/threads/$(threadId)).data.participantIds
                         && incoming().senderId == request.auth.uid;
    }

    match /reports/{reportId} {
      allow create: if isSignedIn() && incoming().reporterId == request.auth.uid;
      allow read: if isAdmin() || (isSignedIn() && existing().reporterId == request.auth.uid);
    }
  }
}`;

fs.writeFileSync('firestore.rules', fRule);
