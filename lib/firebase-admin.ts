import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
export function initFirebaseAdmin() {
  if (!admin.apps.length) {
    try {
      const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
      let serviceAccount = null;

      if (saVar) {
        let cleanSaVar = saVar.trim();
        // Remove surrounding quotes if they exist
        if (
          (cleanSaVar.startsWith('"') && cleanSaVar.endsWith('"')) ||
          (cleanSaVar.startsWith("'") && cleanSaVar.endsWith("'"))
        ) {
          cleanSaVar = cleanSaVar.slice(1, -1).trim();
        }

        // Fix mangled newlines (where \n lost the 'n', e.g. \w instead of \nw)
        const fixedSaVar = cleanSaVar.replace(/\\([^"\\/bfnrtu])/g, '\\n$1');

        try {
          if (fixedSaVar.startsWith('{')) {
            // Direct JSON
            serviceAccount = JSON.parse(fixedSaVar);
          } else {
            // Base64
            const decodedString = Buffer.from(fixedSaVar, 'base64').toString('utf8');
            try {
              serviceAccount = JSON.parse(decodedString);
            } catch (e: any) {
              // Not a valid JSON object after base64 decoding
              console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT (base64 decode resulted in invalid JSON). Check if it is a valid base64-encoded JSON string or direct JSON string.');
            }
          }
        } catch (parseError: any) {
          console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT:', parseError.message);
        }
      }

      if (serviceAccount) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin initialized successfully');
      } else {
        console.warn('FIREBASE_SERVICE_ACCOUNT not configured or invalid. Admin SDK will be skipped.');
      }
    } catch (error: any) {
      console.error('Error initializing Firebase Admin:', error.message);
    }
  }
}
