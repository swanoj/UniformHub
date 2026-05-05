import suburbs from '@/lib/data/au-suburbs.json';

import { calculateDistance, Coordinates } from '@/lib/distance';

type SuburbRecord = {
  suburb: string;
  postcode: string;
  lat: number;
  lng: number;
};

const records = suburbs as SuburbRecord[];

const normalizeSuburb = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[.'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\bsaint\b/g, 'st')
    .replace(/\bst\b/g, 'st')
    .replace(/\bmount\b/g, 'mt')
    .replace(/\bmt\b/g, 'mt');

const normalizePostcode = (value: string) => value.trim().replace(/\D/g, '').padStart(4, '0');

const keyFor = (suburb: string, postcode: string) => `${normalizeSuburb(suburb)}|${normalizePostcode(postcode)}`;

const suburbIndex = new Map<string, Coordinates>();

for (const record of records) {
  const key = keyFor(record.suburb, record.postcode);
  if (!suburbIndex.has(key)) {
    suburbIndex.set(key, { lat: record.lat, lng: record.lng });
  }
}

export function getCoordinates(suburb: string, postcode: string): Coordinates | null {
  if (!suburb.trim() || !postcode.trim()) return null;
  return suburbIndex.get(keyFor(suburb, postcode)) || null;
}

export function getDistanceBetweenSuburbs(
  from: { suburb?: string | null; postcode?: string | null },
  to: { suburb?: string | null; postcode?: string | null }
): number | null {
  const fromCoords = getCoordinates(String(from.suburb || ''), String(from.postcode || ''));
  const toCoords = getCoordinates(String(to.suburb || ''), String(to.postcode || ''));

  if (!fromCoords || !toCoords) return null;
  return calculateDistance(fromCoords, toCoords);
}
