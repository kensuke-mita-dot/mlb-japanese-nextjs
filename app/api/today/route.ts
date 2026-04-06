/**
 * GET /api/today
 * キャッシュ済みの今日の試合成績を返す。
 * キャッシュがなければ MLB Stats API からライブ取得する。
 */
import { NextResponse } from 'next/server';
import { fetchDailyStats, getMlbDate } from '@/lib/mlb';
import { cacheGet, cacheSet } from '@/lib/cache';
import type { PlayerResult } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const date = getMlbDate(-1);
  const cacheKey = `mlb-daily:${date}`;

  const cached = await cacheGet<PlayerResult[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ date, players: cached, source: 'cache' });
  }

  try {
    const players = await fetchDailyStats(date);
    // 1時間キャッシュ（cronが上書きするまでの暫定値）
    await cacheSet(cacheKey, players, 3600);
    return NextResponse.json({ date, players, source: 'live' });
  } catch (err) {
    console.error('/api/today error:', err);
    return NextResponse.json(
      { error: 'データ取得に失敗しました' },
      { status: 500 },
    );
  }
}
