import { supabaseAdmin } from './server';

/**
 * リクエストからSupabaseのuser_idを取得
 * 認証トークンがヘッダーに含まれている場合のみ取得可能
 */
export async function getSupabaseUserId(req: Request): Promise<string | null> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('Failed to get Supabase user ID:', error);
    return null;
  }
}

