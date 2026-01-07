import { supabaseAdmin } from '@/lib/supabase/server';

interface SaveUsageParams {
  userId: string;
  yearMonth: string; // "YYYY-MM" format
  sendCount?: number;
  receiveCount?: number;
  totalPages?: number;
}

/**
 * usage_recordsに送信・受信・ページ数を保存する
 * 同一user_id + year_monthのレコードが存在する場合はUPDATE、存在しない場合はINSERT
 */
export async function saveUsage({
  userId,
  yearMonth,
  sendCount = 0,
  receiveCount = 0,
  totalPages = 0,
}: SaveUsageParams): Promise<void> {
  try {
    // 既存レコードを確認
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('usage_records')
      .select('*')
      .eq('user_id', userId)
      .eq('year_month', yearMonth)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116は「レコードが見つからない」エラー（正常）
      throw fetchError;
    }

    if (existing) {
      // UPDATE: 既存レコードを更新
      const { error: updateError } = await supabaseAdmin
        .from('usage_records')
        .update({
          send_count: existing.send_count + sendCount,
          receive_count: existing.receive_count + receiveCount,
          total_pages: existing.total_pages + totalPages,
        })
        .eq('id', existing.id);

      if (updateError) {
        throw updateError;
      }
    } else {
      // INSERT: 新規レコードを作成
      const { error: insertError } = await supabaseAdmin
        .from('usage_records')
        .insert({
          user_id: userId,
          year_month: yearMonth,
          send_count: sendCount,
          receive_count: receiveCount,
          total_pages: totalPages,
        });

      if (insertError) {
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Failed to save usage record:', error);
    // エラーをログに記録するが、FAX送受信処理は継続する
    // 将来的にはリトライロジックを追加可能
  }
}

/**
 * FAX送信時の利用記録を保存
 */
export async function saveSendUsage(
  userId: string,
  sentAt: Date,
  pageCount: number = 1
): Promise<void> {
  const yearMonth = `${sentAt.getFullYear()}-${String(sentAt.getMonth() + 1).padStart(2, '0')}`;
  await saveUsage({
    userId,
    yearMonth,
    sendCount: 1,
    totalPages: pageCount,
  });
}

/**
 * FAX受信時の利用記録を保存
 */
export async function saveReceiveUsage(
  userId: string,
  receivedAt: Date,
  pageCount: number = 1
): Promise<void> {
  const yearMonth = `${receivedAt.getFullYear()}-${String(receivedAt.getMonth() + 1).padStart(2, '0')}`;
  await saveUsage({
    userId,
    yearMonth,
    receiveCount: 1,
    totalPages: pageCount,
  });
}

