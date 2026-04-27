import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin if it hasn't been initialized
if (!admin.apps.length) {
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountJson) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
      });
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not defined. Admin not initialized.");
    }
  } catch (error) {
    console.error("Firebase Admin Error: ", error);
  }
}

export async function POST(req: Request) {
  try {
    if (!admin.apps.length) {
      return NextResponse.json(
        { error: 'Firebase Admin not configured on server. Missing FIREBASE_SERVICE_ACCOUNT_KEY env var.' },
        { status: 500 }
      );
    }

    const { tokens, title, body, icon, link, data } = await req.json();

    if (!tokens || !tokens.length) {
      return NextResponse.json({ error: 'No FCM tokens provided.' }, { status: 400 });
    }

    const message: any = {
      notification: {
        title: title || 'New Notification',
        body: body || '',
      },
      webpush: {
        notification: {
          icon: icon || '/favicon.ico',
        },
        fcmOptions: {
          link: link || '/',
        },
      },
      tokens: tokens,
    };

    if (data) {
      // FCM data must only contain string values
      const stringifiedData: Record<string, string> = {};
      for (const [key, value] of Object.entries(data)) {
        stringifiedData[key] = String(value);
      }
      message.data = stringifiedData;
    }

    const response = await admin.messaging().sendEachForMulticast(message);
    
    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
