/**
 * GET /api/cron
 *
 * Vercel Cron Jobs から毎日 UTC 05:00 (JST 14:00) に呼び出される。
 * MLB Stats API から前日の試合成績を取得して KV にキャッシュする。
 *
 * vercel.json:
 *   { "crons": [{ "path": "/api/cron", "schedule": "0 5 * * *" }] }
 *
 * セキュリティ: Vercel は Authorization: Bearer <CRON_SECRET> を付与する。
 * 環境変数 CRON_SECRET を設定して不正呼び出しを防ぐ。
 */
import { NextRequest, NextResponse } from 'next/server';
import { fetchDailyStats, getMlbDate } from '@/lib/mlb';
import { cacheSet } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Function タイムアウト (秒)

export async function GET(req: NextRequest) {
  // Vercel Cron 認証チェック
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // UTC 05:00 時点での Eastern 日付 = 前日分の試合日
  const date = getMlbDate(-1);

  console.log(`[cron] Fetching MLB daily stats for ${date}...`);

  try {
    const players = await fetchDailyStats(date);

    const playedCount = players.filter(p => !p.noGame).length;
    console.log(`[cron] Fetched ${playedCount} players with game data.`);

    // 翌朝まで（36時間）キャッシュ
    await cacheSet(`mlb-daily:${date}`, players, 36 * 3600);

    return NextResponse.json({
      ok: true,
      date,
      playedCount,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[cron] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
