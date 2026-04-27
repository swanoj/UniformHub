import { useState, useCallback, useEffect } from 'react';
import { fetchFeedPosts, FeedFilters } from '@/services/feed.service';
import { QueryDocumentSnapshot } from 'firebase/firestore';

export function useFeed(filters: FeedFilters, searchQuery: string) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (isLoadMore = false) => {
    if (loading && isLoadMore) return;
    if (isLoadMore && (!hasMore || fetchingMore)) return;

    if (!isLoadMore) setLoading(true);
    else setFetchingMore(true);
    setError(null);

    try {
      const serverFilters = { ...filters, searchQuery };
      let newDocs = await fetchFeedPosts(serverFilters, isLoadMore ? lastDoc : null);

      if (newDocs.length < 20) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      const parsedPosts = newDocs.map(d => ({ id: d.id, ...d.data() }));

      setPosts(prev => isLoadMore ? [...prev, ...parsedPosts] : parsedPosts);
      
      if (newDocs.length > 0) {
         setLastDoc(newDocs[newDocs.length - 1]);
      }
      
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to load listings. Check permissions or network.");
    } finally {
      if (!isLoadMore) setLoading(false);
      else setFetchingMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, searchQuery, lastDoc, hasMore]); 

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMore(true);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLastDoc(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPosts([]);
    const to = setTimeout(() => {
       fetchPosts(false);
    }, 50);
    return () => clearTimeout(to);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category, filters.type, filters.condition, filters.size, filters.school, filters.suburb, filters.sortBy, searchQuery]); 

  return { posts, loading, hasMore, fetchingMore, fetchPosts, error };
}
