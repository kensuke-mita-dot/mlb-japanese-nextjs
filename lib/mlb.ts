/**
 * MLB Stats API (無料・APIキー不要)
 * ベースURL: https://statsapi.mlb.com
 */
import type { PlayerResult, PitchingGameStats, HittingGameStats, SeasonStats } from './types';
import { PLAYERS } from './players';

const BASE = 'https://statsapi.mlb.com';

/** Eastern Time で今日の MLB 試合日付を返す (YYYY-MM-DD) */
export function getMlbDate(offsetDays = 0): string {
  // UTC + offset → Eastern (UTC-4/UTC-5) で YYYY-MM-DD
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

// --------  型定義 (MLB API レスポンス) --------

interface ApiScheduleGame {
  gamePk: number;
  status: { statusCode: string };
  teams: {
    away: { team: { id: number }; score: number };
    home: { team: { id: number }; score: number };
  };
  decisions?: {
    winner?: { id: number };
    loser?: { id: number };
    save?: { id: number };
  };
}

interface ApiBoxscorePlayer {
  person: { id: number; fullName: string };
  stats: {
    batting?: {
      atBats: number;
      hits: number;
      homeRuns: number;
      rbi: number;
      runs: number;
      doubles: number;
      baseOnBalls: number;
    };
    pitching?: {
      inningsPitched: string;
      strikeOuts: number;
      baseOnBalls: number;
      hits: number;
      earnedRuns: number;
    };
  };
  seasonStats: {
    batting?: { avg: string; obp: string; slg: string; ops: string };
    pitching?: { era: string; whip: string };
  };
}

interface ApiBoxscoreTeam {
  team: { id: number; abbreviation: string };
  players: Record<string, ApiBoxscorePlayer>;
}

// ------ 今日の試合成績を取得 ------

export async function fetchDailyStats(date: string): Promise<PlayerResult[]> {
  // 1. スケジュール取得 (decisions をハイドレート)
  const schedUrl =
    `${BASE}/api/v1/schedule?sportId=1&date=${date}&gameType=R&hydrate=decisions`;

  const schedRes = await fetch(schedUrl, { cache: 'no-store' });
  if (!schedRes.ok) {
    throw new Error(`Schedule API error: ${schedRes.status}`);
  }
  const schedData = await schedRes.json();

  const allGames: ApiScheduleGame[] = schedData.dates?.[0]?.games ?? [];

  // 2. 対象チームの試合に絞り込む (終了済みのみ)
  const watchedTeamIds = new Set(PLAYERS.map(p => p.mlbTeamId));
  const finalStatuses = new Set(['F', 'FT', 'FR', 'FO', 'O']); // Final variants

  const relevantGames = allGames.filter(
    g =>
      finalStatuses.has(g.status.statusCode) &&
      (watchedTeamIds.has(g.teams.away.team.id) ||
        watchedTeamIds.has(g.teams.home.team.id)),
  );

  // 3. 選手結果を初期化 (全員 noGame)
  const results: PlayerResult[] = PLAYERS.map(p => ({ ...p, noGame: true }));

  // 4. ボックススコアを並列取得
  await Promise.all(
    relevantGames.map(async game => {
      try {
        const boxRes = await fetch(
          `${BASE}/api/v1/game/${game.gamePk}/boxscore`,
          { cache: 'no-store' },
        );
        if (!boxRes.ok) return;
        const box = await boxRes.json();

        const awayScore = game.teams.away.score ?? 0;
        const homeScore = game.teams.home.score ?? 0;
        const awayTeam: ApiBoxscoreTeam = box.teams.away;
        const homeTeam: ApiBoxscoreTeam = box.teams.home;
        const gameStr = `${awayTeam.team.abbreviation} ${awayScore}-${homeScore} ${homeTeam.team.abbreviation}`;
        const decisions = game.decisions ?? {};

        for (const side of ['away', 'home'] as const) {
          const teamData: ApiBoxscoreTeam = box.teams[side];
          const isWinner =
            side === 'away' ? awayScore > homeScore : homeScore > awayScore;

          for (const player of Object.values(teamData.players)) {
            const idx = results.findIndex(p => p.mlbId === player.person.id);
            if (idx === -1) continue;

            const batting = player.stats?.batting;
            const pitching = player.stats?.pitching;

            const hasBatted =
              batting != null &&
              (batting.atBats > 0 || batting.baseOnBalls > 0);
            const hasPitched =
              pitching != null &&
              parseFloat(pitching.inningsPitched || '0') > 0;

            if (!hasBatted && !hasPitched) continue;

            const pid = player.person.id;
            const dec =
              pid === decisions.winner?.id
                ? ('W' as const)
                : pid === decisions.loser?.id
                  ? ('L' as const)
                  : pid === decisions.save?.id
                    ? ('S' as const)
                    : null;

            const badges: string[] = [];
            if ((batting?.homeRuns ?? 0) > 0) badges.push('HR');

            const pitStats: PitchingGameStats | undefined = hasPitched
              ? {
                  IP: pitching!.inningsPitched,
                  K: pitching!.strikeOuts,
                  BB: pitching!.baseOnBalls,
                  H: pitching!.hits,
                  ER: pitching!.earnedRuns,
                  ERA: player.seasonStats?.pitching?.era ?? '-.--',
                }
              : undefined;

            const hitStats: HittingGameStats | undefined = hasBatted
              ? {
                  AB: batting!.atBats,
                  H: batting!.hits,
                  HR: batting!.homeRuns,
                  RBI: batting!.rbi,
                  R: batting!.runs,
                  '2B': batting!.doubles,
                  BB: batting!.baseOnBalls,
                }
              : undefined;

            results[idx] = {
              ...PLAYERS[idx],
              noGame: false,
              game: gameStr,
              res: isWinner ? 'W' : 'L',
              dec,
              badges,
              ...(pitStats ? { pit: pitStats } : {}),
              ...(hitStats
                ? {
                    hit: hitStats,
                    hitAvg: player.seasonStats?.batting?.avg ?? '.---',
                  }
                : {}),
            };
          }
        }
      } catch (err) {
        console.error(`Boxscore fetch error for game ${game.gamePk}:`, err);
      }
    }),
  );

  return results;
}

// ------ シーズン通算成績を取得 ------

export async function fetchSeasonStats(
  mlbId: number,
  season: number,
): Promise<SeasonStats | null> {
  if (mlbId === 0) return null;

  try {
    const [pitRes, hitRes] = await Promise.all([
      fetch(
        `${BASE}/api/v1/people/${mlbId}/stats?stats=season&season=${season}&group=pitching`,
        { cache: 'no-store' },
      ),
      fetch(
        `${BASE}/api/v1/people/${mlbId}/stats?stats=season&season=${season}&group=hitting`,
        { cache: 'no-store' },
      ),
    ]);

    const pitData = pitRes.ok ? await pitRes.json() : null;
    const hitData = hitRes.ok ? await hitRes.json() : null;

    const pit = pitData?.stats?.[0]?.splits?.[0]?.stat;
    const hit = hitData?.stats?.[0]?.splits?.[0]?.stat;

    const player = PLAYERS.find(p => p.mlbId === mlbId);
    const type = player?.type ?? 'hitter';

    if (type === 'both' && pit && hit) {
      return {
        type: 'both',
        // pitching
        G: pit.gamesPlayed ?? 0,      // 登板数
        W: pit.wins ?? 0,
        L: pit.losses ?? 0,
        SV: pit.saves ?? 0,
        IP: pit.inningsPitched ?? '0.0',
        ERA: pit.era ?? '-.--',
        WHIP: pit.whip ?? '-.--',
        K: pit.strikeOuts ?? 0,
        BB: pit.baseOnBalls ?? 0,
        // hitting (hitG で打者出場数を別管理)
        hitG: hit.gamesPlayed ?? 0,   // 打者として出場した試合数
        AB: hit.atBats ?? 0,
        H: hit.hits ?? 0,
        HR: hit.homeRuns ?? 0,
        RBI: hit.rbi ?? 0,
        R: hit.runs ?? 0,
        SB: hit.stolenBases ?? 0,
        AVG: hit.avg ?? '.---',
        OBP: hit.obp ?? '.---',
        SLG: hit.slg ?? '.---',
        OPS: hit.ops ?? '.---',
      };
    }

    if ((type === 'pitcher' || type === 'both') && pit) {
      return {
        type: 'pitcher',
        G: pit.gamesPlayed ?? 0,
        W: pit.wins ?? 0,
        L: pit.losses ?? 0,
        SV: pit.saves ?? 0,
        IP: pit.inningsPitched ?? '0.0',
        ERA: pit.era ?? '-.--',
        WHIP: pit.whip ?? '-.--',
        K: pit.strikeOuts ?? 0,
        BB: pit.baseOnBalls ?? 0,
      };
    }

    if (hit) {
      return {
        type: 'hitter',
        G: hit.gamesPlayed ?? 0,
        AB: hit.atBats ?? 0,
        H: hit.hits ?? 0,
        HR: hit.homeRuns ?? 0,
        RBI: hit.rbi ?? 0,
        R: hit.runs ?? 0,
        SB: hit.stolenBases ?? 0,
        AVG: hit.avg ?? '.---',
        OBP: hit.obp ?? '.---',
        SLG: hit.slg ?? '.---',
        OPS: hit.ops ?? '.---',
      };
    }

    return null;
  } catch (err) {
    console.error(`Season stats fetch error for player ${mlbId}:`, err);
    return null;
  }
}
