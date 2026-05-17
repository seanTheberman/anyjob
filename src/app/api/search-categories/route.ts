import { NextRequest, NextResponse } from 'next/server';
import { searchCategories } from '@/lib/categories';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const language = searchParams.get('lang') || undefined;

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Use the search function with geolocation-based language detection
    const results = searchCategories(query, language);
    
    return NextResponse.json({ 
      results: results.slice(0, 20) // Limit to 20 results
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ results: [] });
  }
}
