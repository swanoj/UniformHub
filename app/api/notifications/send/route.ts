import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { initFirebaseAdmin } from '@/lib/firebase-admin';

// Initialize Firebase Admin if not already initialized
initFirebaseAdmin();

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
