import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface FeedFilters {
  category: string;
  type: string;
  condition: string;
  searchQuery?: string;
}

export const fetchFeedPosts = async (
  filters: FeedFilters,
  lastDoc: QueryDocumentSnapshot | null = null,
  batchSize = 20
) => {
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  let q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(50) // fetch a chunk to filter locally
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  
  // Local filtering to avoid Firebase index errors in fresh environments
  const filteredDocs = snapshot.docs.filter(doc => {
    const data = doc.data();
    if (data.status !== 'ACTIVE') return false;
    if (data.communityId) return false;
    if (filters.category && filters.category !== 'All' && data.category !== filters.category) return false;
    if (filters.type && filters.type !== 'All' && data.type !== filters.type) return false;
    if (filters.condition && filters.condition !== 'All' && data.condition !== filters.condition) return false;
    
    if (filters.searchQuery) {
      const term = filters.searchQuery.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2)[0];
      if (term && !data.searchTerms?.includes(term)) return false;
    }
    
    return true;
  });

  return filteredDocs.slice(0, batchSize);
};
