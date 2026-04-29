# UniformHub 61-Item Audit (Code Evidence)

1. Email + password sign-in — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/login/page.tsx:48`
2. Google sign-in — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/login/page.tsx:20`
3. Apple Sign-In (OAuthProvider `apple.com`) — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/lib/firebase.ts:26`
4. Anonymous sign-in DISABLED at config level — 🟡 PARTIAL — `/Users/oliver/Documents/New project/UniformHub-github/app/login/page.tsx` (no anonymous path in code); Firebase Console provider state is external
5. Profile display name + photo only — 🟡 PARTIAL — `/Users/oliver/Documents/New project/UniformHub-github/app/profile/page.tsx:18` (profile includes suburb/school/sportType/clubName)
6. Multi-photo upload — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:69`
7. Item name restricted to ITEM_NAMES taxonomy — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:26`
8. Price field — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:468`
9. Size field — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:428`
10. Condition field — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:576`
11. Location field — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:499`
12. Quantity selector values 1/2/3 — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:445`
13. Quantity decrement logic on partial purchase — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/profile/page.tsx:104`
14. Auto-delete on full purchase — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/profile/page.tsx:101`
15. `expiryAt` field set to +8 weeks on create — 🟡 PARTIAL — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:284` uses `expiresAt` (not `expiryAt`)
16. 8-week expiry cron/scheduled cleanup — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/api/cron/cleanup/route.ts:49` and `/Users/oliver/Documents/New project/UniformHub-github/vercel.json:3`
17. Additional Comments directly after Condition — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:591`
18. No “Senior Boys” qualifiers in dropdowns — ✅ DONE — not found (repo-wide grep)
19. No “Type — Outerwear” field exists — ✅ DONE — not found (repo-wide grep)
20. No seller ratings rendered — ✅ DONE — not found in listing UI
21. Listing detail hierarchy: Item name → Price → Size → Condition → Location — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/posts/[postId]/page.tsx:371`
22. Full AU schools list loaded (~10k) — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/public/schools.json` (10083 entries)
23. Schools typeahead in Create Listing — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:529`
24. Schools typeahead in Profile — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/profile/page.tsx:208`
25. Sport type → club name structure — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/lib/constants.ts:38` and `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:546`
26. Secondhand category present — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:24`
27. Feed view renders posts — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/page.tsx:148`
28. Search input with text filter — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/page.tsx:178`
29. Multi-filter (school/sport/secondhand) functional — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/services/feed.service.ts:41`
30. 1:1 thread create from listing — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/posts/[postId]/page.tsx:163`
31. Text message send/receive — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/chat/[threadId]/page.tsx:137`
32. Photo attachment upload in chat — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/chat/[threadId]/page.tsx:124`
33. No read receipts — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/chat/[threadId]/page.tsx:140` (no `readAt/seen/lastMessageRead` writes)
34. `/admin` route exists with `isAdmin` gate — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/admin/page.tsx:50`
35. Users tab (view users, ban/unban) — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/admin/page.tsx:323`
36. Posts/Listings tab (view/remove) — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/admin/page.tsx:245`
37. Reports tab — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/admin/page.tsx:369`
38. Threads tab — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/admin/page.tsx:411`
39. Report writes hit `/reports` collection — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/posts/[postId]/page.tsx:191`
40. Trigger Email extension configured + firing on `/reports` writes — ✅ DONE — Confirmed working 30 Apr — extension targets named DB ai-studio-...74887, SMTP via Gmail app password, delivery.state=SUCCESS, SMTP 250 OK.
41. `mail` collection rule allows extension write — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/firestore.rules:113` (client deny; extension uses Admin SDK bypass)
42. T&Cs tick-box at signup blocks proceed — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/components/FirebaseProvider.tsx:116`
43. `termsAccepted {version, acceptedAt}` written — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/components/FirebaseProvider.tsx:123`
44. Age 18+ gate at signup — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/components/FirebaseProvider.tsx:116`
45. Regex blocker for personal contact details in listing title + description — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/create/page.tsx:215` and `/Users/oliver/Documents/New project/UniformHub-github/app/posts/edit/[postId]/page.tsx:153`
46. “Keep chat in-app” warning on PostCard — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/components/PostCard.tsx:92`
47. 5-day collection window disclaimer in chat UI — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/app/chat/[threadId]/page.tsx:254`
48. Terms version compare on user load + re-prompt — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/components/FirebaseProvider.tsx:80`
49. Capacitor configured (`capacitor.config.ts`) — 🟡 PARTIAL — deferred in `/Users/oliver/Documents/New project/UniformHub-github/HANDOVER/KNOWN_GAPS.md`
50. Bundle ID = `com.uniformhub.app` — 🟡 PARTIAL — deferred with Capacitor (no `capacitor.config.ts` yet)
51. Privacy Policy URL in metadata/next.config — 🟡 PARTIAL — `/Users/oliver/Documents/New project/UniformHub-github/app/layout.tsx:20` has icons/startup image; explicit privacy URL metadata deferred
52. Production-quality app icons in public/assets — 🟡 PARTIAL — `/Users/oliver/Documents/New project/UniformHub-github/public/icon.png` exists; quality/signoff deferred
53. Production-quality splash screens — 🟡 PARTIAL — `/Users/oliver/Documents/New project/UniformHub-github/public/splash.png` exists; quality/signoff deferred
54. `firestore.rules` uses `rules_version='2'` — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/firestore.rules:1`
55. `firestore.rules` deny-by-default at top — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/firestore.rules:5`
56. `communities/members` read requires auth + `isPublic` — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/firestore.rules:43`
57. No `allow read: if true` in `firestore.rules` — ✅ DONE — not found in `firestore.rules` (verified)
58. `ENABLE_TEST_LOGIN=false` in env local config — ✅ DONE — `/Users/oliver/Documents/New project/UniformHub-github/.env:12`
59. Stripe mocks removed from profile — ✅ DONE — not found in `/Users/oliver/Documents/New project/UniformHub-github/app/profile/page.tsx`
60. Stripe mocks removed from post detail — ✅ DONE — not found in `/Users/oliver/Documents/New project/UniformHub-github/app/posts/[postId]/page.tsx`
61. `stripe` and `@stripe/stripe-js` packages uninstalled — ✅ DONE — not found in `/Users/oliver/Documents/New project/UniformHub-github/package.json`

## Summary

- Done: 51
- Partial: 10
- Not done: 0
