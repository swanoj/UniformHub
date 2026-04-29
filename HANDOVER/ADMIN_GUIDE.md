# UniformHub Admin Guide

## Granting admin access

Admin access is controlled by the `isAdmin` field on each user document in Firestore. The previous `/dev/make-me-admin` helper route has been removed and is no longer available.

Use one of these methods:

1. Firebase Console method:
   - Open Firestore Data in the Firebase Console.
   - Go to `users/{uid}` for the target user.
   - Set `isAdmin: true` (boolean) to grant access.
   - Set `isAdmin: false` (or remove the field) to revoke access.
2. In-app admin method:
   - Sign in as an existing admin and open `/admin`.
   - In the **Users** tab, toggle admin access for another user.

**Onboarding a new admin from scratch:** the target user must first sign in to UniformHub via Google Sign-In at least once — this creates their `users/{uid}` document. Only after that can their `isAdmin` field be flipped. Test login is disabled in production, so Google Sign-In is the only path to creating a user doc.

Important: always keep at least one admin account active so admin access is never lost.

## The `/admin` page (4 tabs)

- **Users**: View all users, toggle `isAdmin`, and soft-ban/unban users.
- **Listings**: View all posts and take down inappropriate listings (sets `status: removed`).
- **Reports**: Review user-submitted reports and mark them resolved.
- **Stats**: Monitor total users, active listings, open reports, and flagged listings.

## Security model

Firestore rules are deny-by-default, then explicitly allow specific operations by collection. Admin permissions are enforced via `isAdmin()`, which reads `users/{uid}.isAdmin`. Admin users can moderate across users, posts, and reports; non-admin users are restricted to their own data paths and approved public reads. Test login has been disabled for production use, and Google Sign-In is the active sign-in method.

## Common admin tasks

- Ban or unban a user from the **Users** tab.
- Grant or revoke admin permissions for trusted operators.
- Remove a listing that breaches policy from **Listings**.
- Resolve a report after reviewing context in **Reports**.
- Check platform health and moderation load in **Stats**.
