import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));

admin.initializeApp({
  projectId: firebaseConfig.projectId,
  databaseURL: `https://(default).firebaseio.com` // might not be needed for just firestore
});

const db = admin.firestore();
// Need to set the specific databaseId if AI Studio uses a named database
db.settings({
  databaseId: firebaseConfig.firestoreDatabaseId
});

async function run() {
  const snap = await db.collection('posts').get();
  const wtsListings = snap.docs.map(doc => doc.data()).filter(d => d.postType === 'LISTING' && d.type === 'WTS');
  
  console.log(`Found ${wtsListings.length} WTS listings for sale.`);
  wtsListings.forEach(data => {
    console.log(`- "${data.title}" ($${data.price}) | Condition: ${data.condition || 'N/A'} | Status: ${data.status} | By: ${data.ownerName}`);
  });
  
  process.exit(0);
}

run();
