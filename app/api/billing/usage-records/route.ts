import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * usage_recordsを取得（ユーザーIDと期間でフィルタリング可能）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let query = supabaseAdmin
      .from('usage_records')
      .select('*')
      .order('year_month', { ascending: false })
      .limit(limit);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: usageRecords, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      usage_records: usageRecords || [],
    });
  } catch (error) {
    console.error('Failed to fetch usage records:', error);
    return NextResponse.json(
      { error: '利用記録の取得に失敗しました' },
      { status: 500 }
    );
  }
}

