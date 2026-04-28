# Environment Variables Configuration

## Client-Side (Prefix with `NEXT_PUBLIC_`)
| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | e.g., `sniperform-ads-dashboard.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `sniperform-ads-dashboard` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | e.g., `sniperform-ads-dashboard.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Project Number |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App Identifier |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | For Push Notifications |

## Server-Side / Build-Time
| Variable | Description |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON string of the Firebase Service Account (Base64 encoded if necessary for CI). |
| `ADMIN_EMAIL` | `sascha.crawford@hotmail.com` (Target for reports). |
