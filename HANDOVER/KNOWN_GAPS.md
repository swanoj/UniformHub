# UniformHub Known Gaps

## 1) Phase 1 deliverables not yet shipped

- **Apple Sign-In not configured**  
  Next step: complete Apple Developer setup (Service ID, Key ID, Team ID, private key), enable Apple provider in Firebase Auth, then run a full sign-in test on iOS.  
  Estimate: 1-2 hours.

- **Sports directory not implemented**  
  Next step: define scope with client first (sports taxonomy, search UX, moderation model, and data source), then ship in a scoped follow-up sprint.

- **App Store screenshots pending**  
  Next step: capture final screenshots once UI is frozen and moderation/admin flows are final.  
  Estimate: ~15 minutes.

- **Explainer video deferred**  
  Next step: script and record separately once product positioning and launch flow are locked.

## 2) Phase 2 polish gaps

- **Production website still pending** (`uniformhub.com.au`)  
  Current state uses Base44 pitch assets as marketing surface.  
  Next step: deploy a production website/landing aligned to current app status and links.

- **FCM push not end-to-end verified in production**  
  VAPID key is configured and client hook is hardened, but real delivery has not been confirmed with a production token + send pipeline.  
  Next step: run a full push test matrix (foreground/background, Android emulator + real device).

- **`mail` collection has no explicit Firestore rule**  
  Current behavior relies on default-deny and server-side writes only.  
  Next step: add explicit rule documentation and rule entries if any client write path is introduced.

- **`isValidPost` rule allows `qty` from 0-3**  
  Next step: confirm with client whether `qty: 0` is intended business logic.

- **Composite Firestore indexes may be needed later**  
  Next step: monitor console index errors from posts sort/filter combinations and create required indexes as they surface.

- **Empty `(default)` Firestore database still exists**  
  Active app DB is named `ai-studio-763f001b-7206-4556-b5c7-087611c74887`.  
  Next step: audit and decommission the empty default DB when safe.

## 3) Code-level technical debt

- **Semantic fallback issue in create flow**  
  `app/create/page.tsx:261` currently uses `form.school || profile?.suburb || 'Local'` for suburb fallback, which can mix school names into suburb data.  
  Next step: split school/suburb logic when sport/suburb model is finalized.

- **No admin audit log collection**  
  Ban, takedown, and admin-role changes are not persisted to a dedicated audit trail.  
  Next step: add `admin_actions/{id}` with actor, action, target, reason, and timestamp fields.

- **Real-phone HTTPS testing not established**  
  LAN IP workflow is suitable for emulator, but real phone testing needs public HTTPS.  
  Next step: use ngrok or staging deploy for phone QA and OAuth/callback verification.

## 4) Phase 3 features (priced separately)

- Payments integration (e.g. Stripe Connect)
- Subscription plans / paid tiers
- Claim-store and school-account verification flows
- Verified badges and trust indicators
- Multi-user school shop account management

Next step for this section: convert each to scoped backlog epics with acceptance criteria and estimates.

## 5) Documentation gaps

- `ARCHITECTURE.md` not authored
- `DEPLOYMENT.md` not authored
- `RUNBOOK.md` not authored
- `CHANGELOG.md` not authored
- Loom walkthrough not recorded

Next step: produce these docs during handover finalization so operational ownership can transition cleanly.
