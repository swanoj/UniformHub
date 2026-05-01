import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim() || '';
  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    '';

  if (!apiKey) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.set('input', query);
    url.searchParams.set('types', '(cities)');
    url.searchParams.set('components', 'country:au');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const data = await res.json();
    const suggestions: string[] = (data.predictions || [])
      .map((p: { description?: string; structured_formatting?: { main_text?: string } }) => {
        if (p?.structured_formatting?.main_text) return p.structured_formatting.main_text;
        if (!p?.description) return '';
        return String(p.description).split(',')[0]?.trim() || '';
      })
      .filter(Boolean);

    return NextResponse.json({ suggestions: Array.from(new Set(suggestions)).slice(0, 8) });
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
