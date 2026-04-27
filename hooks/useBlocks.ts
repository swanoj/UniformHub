import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function useBlocks(currentUserId: string | undefined) {
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  if (!currentUserId && (blockedUserIds.length > 0 || loading)) {
    setBlockedUserIds([]);
    setLoading(false);
  }

  useEffect(() => {
    if (!currentUserId) return;

    const q = query(
      collection(db, 'blocks'),
      where('blockerId', '==', currentUserId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids = snapshot.docs.map(doc => doc.data().blockedId);
      setBlockedUserIds(ids);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  return { blockedUserIds, loading };
}
