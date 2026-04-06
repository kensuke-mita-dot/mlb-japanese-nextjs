import { Suspense } from 'react';
import { fetchDailyStats, getMlbDate } from '@/lib/mlb';
import { cacheGet } from '@/lib/cache';
import type { PlayerResult } from '@/lib/types';
import Widget from '@/components/Widget';

// 毎時再検証（cronが更新したキャッシュを反映）
export const revalidate = 3600;

async function getPlayers(): Promise<{ players: PlayerResult[]; date: string }> {
  // cron が JST 14:00 (UTC 05:00) に昨日分をキャッシュ済みの想定
  // ページアクセス時は今日の Eastern 日付を使用
  const date = getMlbDate(-1);
  const cacheKey = `mlb-daily:${date}`;

  // 1. キャッシュを確認
  const cached = await cacheGet<PlayerResult[]>(cacheKey);
  if (cached) return { players: cached, date };

  // 2. キャッシュなし → MLB Stats API からライブ取得
  try {
    const players = await fetchDailyStats(date);
    return { players, date };
  } catch (err) {
    console.error('Failed to fetch daily stats:', err);
    return { players: [], date };
  }
}

export default async function Page() {
  const { players, date } = await getPlayers();

  return (
    <div className="app">
      <Suspense fallback={null}>
        <Widget initialPlayers={players} date={date} />
      </Suspense>
    </div>
  );
}
