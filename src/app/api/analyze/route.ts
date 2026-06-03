import { NextRequest, NextResponse } from 'next/server';
import { extractToneFromUrl, AnalysisResult } from '@/lib/tone-parser';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'Invalid URLs list' }, { status: 400 });
    }

    // Process in batches
    const results: AnalysisResult[] = [];
    const batchSize = 5;

    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(url => extractToneFromUrl(url))
      );
      results.push(...batchResults);
    }

    // Insert into Supabase
    // We use insert but you might want to use upsert if you define a unique constraint on url + date
    const { data, error } = await supabase
      .from('analyses')
      .insert(results)
      .select();

    if (error) {
      console.error("Supabase Error", error);
      throw new Error(error.message);
    }

    return NextResponse.json({ 
      success: true, 
      count: results.length, 
      data: results 
    });

  } catch (error: any) {
    console.error("API Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
