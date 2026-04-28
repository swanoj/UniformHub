import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

const firebaseConfig = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf-8'));
const FIRESTORE_DATABASE_ID = 'ai-studio-763f001b-7206-4556-b5c7-087611c74887';

admin.initializeApp({
  projectId: firebaseConfig.projectId
});

const db = admin.firestore();
// Route utility queries to the same named Firestore database used by the app.
db.settings({
  databaseId: FIRESTORE_DATABASE_ID
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
