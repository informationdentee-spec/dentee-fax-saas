'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface UsageRecord {
  year_month: string;
  send_count: number;
  receive_count: number;
  total_pages: number;
}

export function UsageSummary({ userId }: { userId?: string }) {
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchUsageRecords = async () => {
      try {
        // 最新6ヶ月分の利用記録を取得
        const response = await fetch(`/api/billing/usage-records?user_id=${userId}&limit=6`);
        if (!response.ok) {
          throw new Error('利用記録の取得に失敗しました');
        }

        const data = await response.json();
        setUsageRecords(data.usage_records || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchUsageRecords();
  }, [userId]);

  if (!userId) {
    return null;
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>利用状況</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>利用状況</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (usageRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>利用状況</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">利用記録がありません</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>利用状況（過去6ヶ月）</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {usageRecords.map((record) => (
            <div
              key={record.year_month}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
            >
              <div>
                <p className="font-semibold text-slate-900">{record.year_month}</p>
                <p className="text-sm text-slate-600">
                  送信: {record.send_count}件 / 受信: {record.receive_count}件
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-900">{record.total_pages}ページ</p>
                <p className="text-xs text-slate-500">合計</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

