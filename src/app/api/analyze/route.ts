import { NextRequest, NextResponse } from 'next/server';
import { extractToneFromUrl, AnalysisResult } from '@/lib/tone-parser';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  console.log('--- Analyze API Start ---');
  try {
    const body = await req.json();
    const items = body.data || body.urls?.map((url: string) => ({ url }));
    const targetDate = body.date || new Date().toISOString();

    if (!items || !Array.isArray(items)) {
      console.error('Invalid data provided');
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    console.log(`Received ${items.length} items to process. Target Date: ${targetDate}`);

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
    console.log('Extraction complete. Starting local keyword relevance filter...');

    // --- Local keyword relevance filter (no external API needed) ---
    // Reads keywords from the env variable INTEREST_KEYWORDS.
    // Falls back to saving everything if no keywords are configured.
    const rawKeywords = process.env.INTEREST_KEYWORDS || '';

    // Helper: strip accents and lowercase for robust matching
    const normalizeText = (str: string): string =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    let filteredResults = [...rawResults];

    if (rawKeywords.trim()) {
      // Parse comma-separated list, strip spaces, remove empty entries
      const keywords = rawKeywords
        .split(',')
        .map(k => normalizeText(k.trim()))
        .filter(k => k.length > 0);

      console.log(`Filtering with ${keywords.length} keyword(s):`, keywords);

      filteredResults = rawResults.filter(item => {
        const searchSpace = normalizeText(
          `${item.title ?? ''} ${item.summary ?? ''}`
        );
        // Keep the row if ANY keyword appears anywhere in the combined text
        return keywords.some(kw => searchSpace.includes(kw));
      });

      console.log(
        `Keyword filter done. Kept ${filteredResults.length} of ${rawResults.length} items.`
      );
    } else {
      console.warn(
        '⚠️ INTEREST_KEYWORDS not set in .env — saving all items without filtering.'
      );
    }
    // --- End of local keyword filter ---

    // Map to database schema and sanitize only the filtered results
    const dbResults = filteredResults.map(item => ({
      url: item.url,
      title: item.title,
      tone: item.tone,
      emoji: item.emoji,
      status: item.status,
      timestamp: targetDate, // Use the provided date
      type: item.type,
      region: item.region,
      media: item.media,
      summary: item.summary,
      tier: item.tier,
      costo_publicitario: item.costo_publicitario,
      audiencia: item.audiencia,
      lecturabilidad: item.lecturabilidad
    }));

    if (dbResults.length === 0) {
      console.log('No relevant articles found after keyword filtering.');
      return NextResponse.json({
        success: true,
        count: 0,
        data: []
      });
    }

    console.log(`Inserting ${dbResults.length} rows into Supabase...`);
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
      count: filteredResults.length, 
      data: filteredResults 
    });

  } catch (error: any) {
    console.error("CRITICAL API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
