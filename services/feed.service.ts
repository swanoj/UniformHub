import { collection, query, where, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface FeedFilters {
  category: string;
  type: string;
  condition: string;
  searchQuery?: string;
  size?: string;
  school?: string;
  suburb?: string;
  sportType?: string;
  secondhandOnly?: boolean;
  sortBy?: string;
}

export const fetchFeedPosts = async (
  filters: FeedFilters,
  lastDoc: QueryDocumentSnapshot | null = null,
  batchSize = 20
) => {
  let constraints: QueryConstraint[] = [];
  
  // Base constraints
  constraints.push(where('status', '==', 'ACTIVE'));
  constraints.push(where('communityId', '==', null));

  // Secondary Filters
  if (filters.category && filters.category !== 'All') {
    constraints.push(where('category', '==', filters.category));
  }
  if (filters.type && filters.type !== 'All') {
    constraints.push(where('type', '==', filters.type));
  }
  if (filters.condition && filters.condition !== 'All') {
    constraints.push(where('condition', '==', filters.condition));
  }
  if (filters.size && filters.size !== 'All') {
    constraints.push(where('size', '==', filters.size));
  }
  if (filters.school && filters.school !== 'All') {
    constraints.push(where('school', '==', filters.school));
  }
  if (filters.suburb && filters.suburb !== 'All') {
    constraints.push(where('suburb', '==', filters.suburb));
  }
  if (filters.sportType && filters.sportType !== 'All') {
    constraints.push(where('sportType', '==', filters.sportType));
  }
  if (filters.secondhandOnly) {
    constraints.push(where('category', '==', 'Secondhand'));
  }

  // Handle Search Query array-contains
  if (filters.searchQuery) {
    const term = filters.searchQuery.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/s+/).filter(w => w.length > 2)[0];
    if (term) {
      constraints.push(where('searchTerms', 'array-contains', term));
    }
  }

  // Handle Sort By
  if (filters.sortBy === 'PriceLowToHigh') {
    constraints.push(orderBy('price', 'asc'));
  } else if (filters.sortBy === 'PriceHighToLow') {
    constraints.push(orderBy('price', 'desc'));
  } else {
    // Default Newest First
    constraints.push(orderBy('createdAt', 'desc'));
  }

  // Pagination
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  constraints.push(limit(batchSize));

  let q = query(collection(db, 'posts'), ...constraints);
  
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs;
  } catch (error) {
    console.error('Firestore query failed. This is likely due to a missing composite index. See console for index URLs:', error);
    // If the index fails, we could try to gracefully degrade sorting, but for this instruction we throw.
    throw error;
  }
};
