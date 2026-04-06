export type PlayerType = 'pitcher' | 'hitter' | 'both';

export interface PlayerMaster {
  name: string;       // 日本語表記
  nameEn: string;     // English name (MLB API search用)
  team: string;       // チーム略称
  type: PlayerType;
  mlbId: number;      // MLB Stats API player ID (0 = 未確定)
  mlbTeamId: number;  // MLB Stats API team ID
}

export interface PitchingGameStats {
  IP: string;
  K: number;
  BB: number;
  H: number;
  ER: number;
  ERA: string;  // season ERA after game
}

export interface HittingGameStats {
  AB: number;
  H: number;
  HR: number;
  RBI: number;
  R: number;
  '2B': number;
  BB?: number;
}

export interface PlayerResult extends PlayerMaster {
  noGame?: boolean;
  game?: string;          // e.g. "LAD 8-6 WSH"
  res?: 'W' | 'L' | 'T';
  pit?: PitchingGameStats;
  hit?: HittingGameStats;
  hitAvg?: string;        // season batting avg after game
  dec?: 'W' | 'L' | 'S' | null;
  badges?: string[];
  note?: string;
}

export interface DailyData {
  date: string;       // YYYY-MM-DD (Eastern Time)
  fetchedAt: string;  // ISO timestamp
  players: PlayerResult[];
}

// Season stats returned by /api/season
interface PitchingSeasonFields {
  G: number;
  W: number;
  L: number;
  SV: number;
  IP: string;
  ERA: string;
  WHIP: string;
  K: number;
  BB: number;
}

interface HittingSeasonFields {
  G: number;
  AB: number;
  H: number;
  HR: number;
  RBI: number;
  R: number;
  SB: number;
  AVG: string;
  OBP: string;
  SLG: string;
  OPS: string;
}

export interface PitchingSeasonStats extends PitchingSeasonFields {
  type: 'pitcher';
  seasonNote?: string;
}

export interface HittingSeasonStats extends HittingSeasonFields {
  type: 'hitter';
  seasonNote?: string;
}

// 二刀流は投手Gと野手Gが別なので hitG で上書き
export interface TwoWaySeasonStats extends PitchingSeasonFields, HittingSeasonFields {
  type: 'both';
  hitG: number;   // 野手として出場した試合数 (打者G ≠ 投手G)
  seasonNote?: string;
}

export type SeasonStats = PitchingSeasonStats | HittingSeasonStats | TwoWaySeasonStats;
