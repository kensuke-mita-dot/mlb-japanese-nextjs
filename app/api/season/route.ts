/**
 * GET /api/season?playerId=<mlbId>&season=<year>
 *
 * MLB Stats API からシーズン通算成績を取得するサーバーサイドプロキシ。
 * フロントエンドに API キーを露出させない。
 *
 * オプション: ANTHROPIC_API_KEY が設定されていれば、
 * Claude による日本語コメント (seasonNote) を付与する。
 */
import { NextRequest, NextResponse } from 'next/server';
import { fetchSeasonStats, getMlbDate } from '@/lib/mlb';
import { cacheGet, cacheSet } from '@/lib/cache';
import { PLAYERS } from '@/lib/players';
import type { SeasonStats } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playerIdStr = searchParams.get('playerId');

  if (!playerIdStr) {
    return NextResponse.json({ error: 'playerId が必要です' }, { status: 400 });
  }

  const mlbId = parseInt(playerIdStr, 10);
  if (isNaN(mlbId) || mlbId === 0) {
    return NextResponse.json(
      { error: 'この選手の MLB ID はまだ登録されていません' },
      { status: 404 },
    );
  }

  const season = parseInt(searchParams.get('season') ?? '', 10) || new Date().getFullYear();
  const cacheKey = `mlb-season:${mlbId}:${season}`;

  // キャッシュ確認（24時間）
  const cached = await cacheGet<SeasonStats>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // MLB Stats API から取得
  const stats = await fetchSeasonStats(mlbId, season);
  if (!stats) {
    return NextResponse.json(
      { error: '成績データが見つかりませんでした' },
      { status: 404 },
    );
  }

  // Anthropic API で日本語コメントを生成（APIキーが設定されている場合のみ）
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const player = PLAYERS.find(p => p.mlbId === mlbId);
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new Anthropic();

      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 120,
        system: '選手の今シーズン成績について、30文字以内の日本語コメントを1文だけ返してください。マークダウン不使用。',
        messages: [
          {
            role: 'user',
            content: `${player?.name ?? mlbId} (${player?.team}) の ${season}年シーズン成績: ${JSON.stringify(stats)}`,
          },
        ],
      });

      const note = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
      if (note) (stats as SeasonStats & { seasonNote?: string }).seasonNote = note;
    } catch (err) {
      // コメント生成失敗は無視
      console.warn('Anthropic comment generation failed:', err);
    }
  }

  // 翌日まで（24時間）キャッシュ
  await cacheSet(cacheKey, stats, 86_400);

  return NextResponse.json(stats);
}
