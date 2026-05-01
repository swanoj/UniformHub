import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')?.trim();
  const lng = req.nextUrl.searchParams.get('lng')?.trim();

  if (!lat || !lng) {
    return NextResponse.json({ suburb: '' }, { status: 200 });
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

  if (!apiKey) {
    return NextResponse.json({ suburb: '' }, { status: 200 });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ suburb: '' }, { status: 200 });
    }

    const data = await res.json();
    const first = data.results?.[0];
    const components = first?.address_components || [];
    const suburb =
      components.find((c: { types?: string[] }) => c.types?.includes('locality'))?.long_name ||
      components.find((c: { types?: string[] }) => c.types?.includes('sublocality'))?.long_name ||
      components.find((c: { types?: string[] }) => c.types?.includes('administrative_area_level_2'))?.long_name ||
      '';

    return NextResponse.json({ suburb });
  } catch {
    return NextResponse.json({ suburb: '' }, { status: 200 });
  }
}
