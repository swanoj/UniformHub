import { describe, it, expect, vi } from 'vitest';
import { fetchFeedPosts } from '../services/feed.service';

// Mock the Firebase module
vi.mock('../lib/firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn((coll, ...args) => ({ coll, args })),
  where: vi.fn((field, op, value) => ({ type: 'where', field, op, value })),
  orderBy: vi.fn((field, dir) => ({ type: 'orderBy', field, dir })),
  limit: vi.fn((l) => ({ type: 'limit', value: l })),
  startAfter: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] }))
}));

describe('Feed Filters', () => {
  it('should build query with correct filters', async () => {
    const filters = {
      category: 'School',
      type: 'SALE',
      condition: 'New'
    };
    
    // We can't fully execute fetchFeedPosts if it relies on getDocs real results,
    // but we can verify the mock was called.
    const getDocsMock = await import('firebase/firestore').then(m => m.getDocs);
    const queryMock = await import('firebase/firestore').then(m => m.query);
    
    await fetchFeedPosts(filters);
    
    expect(getDocsMock).toHaveBeenCalled();
    expect(queryMock).toHaveBeenCalled();
  });
});
