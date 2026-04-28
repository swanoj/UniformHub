# Firestore Security Rules Summary

## Key Principles
1. **Authenticated Access**: Most writes require `request.auth != null`.
2. **Ownership Enforcement**: Users can only edit their own profile, listings, and messages.
3. **Admin Privileges**: Users with `isAdmin: true` can manage all collections.
4. **Validation**: Listings are validated to ensure required fields and constraints (e.g., quantity 0-3).


## Critical Rules
- `users`: Read by all authentication users; update by self or admin.
- `posts`: public read; create by authenticated; update only by owner or admin.
- `reports`: create by authenticated; read/update by admin only.
- `threads`: read/update only by participants.

## Deployment Command
Run after any changes:
```bash
firebase deploy --only firestore:rules
```
