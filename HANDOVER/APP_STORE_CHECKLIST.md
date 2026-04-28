# App Store / Production Readiness Checklist

## Branding & Assets
- [x] App Icon (1024x1024) - `public/icon.png`
- [x] Splash Screen - `public/splash.png`
- [x] Meta Tags (SEO) implemented in Layout.

## Legal & Compliance
- [x] Terms & Conditions (Legal page and Acceptance gate).
- [x] Age check (18+ requirement).
- [x] Reporting mechanism for objectionable content.
- [x] Privacy Policy link.

## Firebase Configuration
- [x] Switch to production Project ID.
- [x] Configure Firebase Hosting domain.
- [x] Verify Firestore Indexing (especially for filtering listings).
- [x] Enable Firebase Trigger Email extension for admin notifications.

## Testing
- [ ] End-to-end listing creation.
- [ ] Multi-item purchase (quantity decrement).
- [ ] Admin panel access and report management.
- [ ] Responsive UI verification on iOS/Android browsers.
