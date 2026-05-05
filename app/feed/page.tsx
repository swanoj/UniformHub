import { notFound } from 'next/navigation';
import { FEATURES } from '@/lib/constants';

export default function FeedRoute() {
  if (!FEATURES.feed) {
    notFound();
  }

  notFound();
}
