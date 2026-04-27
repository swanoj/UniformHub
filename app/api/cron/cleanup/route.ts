import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    const saVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    let serviceAccount = null;

    if (saVar) {
      if (saVar.trim().startsWith('{')) {
        serviceAccount = JSON.parse(saVar);
      } else {
        serviceAccount = JSON.parse(Buffer.from(saVar, 'base64').toString());
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!admin.apps.length) {
    return NextResponse.json({ error: 'Admin SDK not configured' }, { status: 503 });
  }

  try {
    const db = admin.firestore();
    const postsRef = db.collection('posts');
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    
    // We fetch posts older than 8 weeks that are not already EXPIRED
    const qSnapshot = await postsRef
      .where('createdAt', '<', admin.firestore.Timestamp.fromDate(eightWeeksAgo))
      .where('status', 'in', ['ACTIVE', 'PENDING_APPROVAL'])
      .get();
    
    if (qSnapshot.empty) {
      return NextResponse.json({ message: 'No listings to expire.' }, { status: 200 });
    }

    const batch = db.batch();
    let count = 0;

    qSnapshot.forEach((postDoc) => {
      batch.update(postDoc.ref, {
        status: 'EXPIRED',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;
    });

    await batch.commit();

    return NextResponse.json({ message: `Successfully expired ${count} listings.` }, { status: 200 });
  } catch (error: any) {
    console.error("Cron Cleanup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
