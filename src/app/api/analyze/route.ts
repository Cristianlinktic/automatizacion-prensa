import { NextRequest, NextResponse } from 'next/server';
import { extractToneFromUrl, AnalysisResult } from '@/lib/tone-parser';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log('--- Analyze API Start ---');
  try {
    const { urls } = await req.json();
    console.log(`Received ${urls?.length} URLs to process`);

    if (!urls || !Array.isArray(urls)) {
      console.error('Invalid URL list provided');
      return NextResponse.json({ error: 'Invalid URLs list' }, { status: 400 });
    }

    // Process in batches
    const rawResults: AnalysisResult[] = [];
    const batchSize = 5;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1}...`);
      const batchResults = await Promise.all(
        batch.map(url => extractToneFromUrl(url))
      );
      rawResults.push(...batchResults);
    }
    console.log('Extraction complete. Mapping to DB schema...');

    // Map to database schema and sanitize
    const dbResults = rawResults.map(item => ({
      url: item.url,
      title: item.title,
      tone: item.tone,
      emoji: item.emoji,
      status: item.status,
      timestamp: item.timestamp 
    }));

    console.log('Inserting into Supabase...');
    const { data, error } = await supabase
      .from('analyses')
      .insert(dbResults)
      .select();

    if (error) {
      console.error("Supabase Insertion ERROR:", error);
      return NextResponse.json({ 
        error: `Database error: ${error.message}`,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('Insertion successful. Rows created:', data?.length);
    console.log('--- Analyze API End ---');

    return NextResponse.json({ 
      success: true, 
      count: rawResults.length, 
      data: rawResults 
    });

  } catch (error: any) {
    console.error("CRITICAL API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
