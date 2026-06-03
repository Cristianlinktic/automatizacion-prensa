import { NextRequest, NextResponse } from 'next/server';
import { extractToneFromUrl, AnalysisResult } from '@/lib/tone-parser';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log('--- Analyze API Start ---');
  try {
    const body = await req.json();
    const items = body.data || body.urls?.map((url: string) => ({ url }));

    if (!items || !Array.isArray(items)) {
      console.error('Invalid data provided');
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    console.log(`Received ${items.length} items to process. Example first item:`, items[0]);

    // Process in batches
    const rawResults: AnalysisResult[] = [];
    const batchSize = 5;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1}...`);
      
      const batchResults = await Promise.all(
        batch.map(async (item: any) => {
          const scraped = await extractToneFromUrl(item.url);
          // Overwrite scraped data with Excel data if present (checking for null/undefined)
          return {
            ...scraped,
            type: (item.tipo !== null && item.tipo !== undefined) ? item.tipo : scraped.type,
            media: (item.medio !== null && item.medio !== undefined) ? item.medio : scraped.media,
            summary: (item.resumen !== null && item.resumen !== undefined) ? item.resumen : scraped.summary,
            region: (item.region !== null && item.region !== undefined) ? item.region : scraped.region,
            tier: item.tier,
            costo_publicitario: item.costo,
            audiencia: item.audiencia,
            lecturabilidad: item.lecturabilidad
          };
        })
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
      timestamp: item.timestamp,
      type: item.type,
      region: item.region,
      media: item.media,
      summary: item.summary,
      tier: item.tier,
      costo_publicitario: item.costo_publicitario,
      audiencia: item.audiencia,
      lecturabilidad: item.lecturabilidad
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
