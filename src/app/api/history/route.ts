import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateStr = searchParams.get('date'); // Expected format: yyyy-MM-dd

    if (!dateStr) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

    const date = parseISO(dateStr);
    const start = startOfDay(date).toISOString();
    const end = endOfDay(date).toISOString();

    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .gte('timestamp', start)
      .lte('timestamp', end)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error("Supabase History Error", error);
      throw new Error(error.message);
    }

    return NextResponse.json({ data: data || [] });

  } catch (error: any) {
    console.error("History API Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
