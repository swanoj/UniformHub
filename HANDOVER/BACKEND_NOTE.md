# Backend Configuration & Infrastructure Notes

## Firebase Project
- **Project ID**: `sniperform-ads-dashboard`
- **Location**: default-gcp-region

## Auth Providers
- **Email/Password**: Enabled.
- **Google Auth**: Enabled.

## Extensions Required
1. **Trigger Email**: 
   - Post to collection: `mail`
   - Configured SMTP / SendGrid for outgoing report notifications.

## Firestore Indexes
Required composite indexes for:
- `posts`: `status` (ASC) + `createdAt` (DESC)
- `posts`: `school` (ASC) + `status` (ASC) + `createdAt` (DESC)

## Admin Access
Admin status is controlled manually in the `users` collection. Update a user document with:
```json
{ "isAdmin": true }
```
to grant access to the `/admin` panel.
