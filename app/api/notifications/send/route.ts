import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    let serviceAccount = null;

    if (saVar) {
      try {
        if (saVar.trim().startsWith('{')) {
          // Direct JSON
          serviceAccount = JSON.parse(saVar);
        } else {
          // Base64
          serviceAccount = JSON.parse(Buffer.from(saVar, 'base64').toString());
        }
      } catch (parseError) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT array:', parseError);
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('Firebase Admin initialized successfully');
    } else {
      console.warn('FIREBASE_SERVICE_ACCOUNT not configured. Push notifications will be skipped.');
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export async function POST(req: Request) {
  if (!admin.apps.length) {
    return NextResponse.json({ error: 'FCM not configured' }, { status: 503 });
  }

  try {
    const { tokens, title, body, data } = await req.json();

    if (!tokens || !tokens.length) {
      return NextResponse.json({ error: 'No tokens provided' }, { status: 400 });
    }

    const message = {
      notification: { title, body },
      data: data || {},
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    return NextResponse.json({ 
      success: true, 
      successCount: response.successCount, 
      failureCount: response.failureCount 
    });
  } catch (error) {
    console.error('Error sending FCM message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
