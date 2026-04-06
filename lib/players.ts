import type { PlayerMaster } from './types';

/**
 * 日本人選手マスタ (スポーツナビ掲載14選手 + ヌートバー)
 * MLB ID は 2026年シーズンロスターで全件確認済み
 */
export const PLAYERS: PlayerMaster[] = [
  // ===== 投手 =====
  {
    name: '大谷 翔平',
    nameEn: 'Shohei Ohtani',
    team: 'LAD',
    type: 'both',
    mlbId: 660271,   // confirmed via LAD roster 2026
    mlbTeamId: 119,
  },
  {
    name: '佐々木 朗希',
    nameEn: 'Roki Sasaki',
    team: 'LAD',
    type: 'pitcher',
    mlbId: 808963,   // confirmed via LAD roster 2026
    mlbTeamId: 119,
  },
  {
    name: '山本 由伸',
    nameEn: 'Yoshinobu Yamamoto',
    team: 'LAD',
    type: 'pitcher',
    mlbId: 808967,   // confirmed via LAD roster 2026
    mlbTeamId: 119,
  },
  {
    name: '千賀 滉大',
    nameEn: 'Kodai Senga',
    team: 'NYM',
    type: 'pitcher',
    mlbId: 673540,   // confirmed via NYM roster 2026
    mlbTeamId: 121,
  },
  {
    name: '今永 昇太',
    nameEn: 'Shota Imanaga',
    team: 'CHC',
    type: 'pitcher',
    mlbId: 684007,   // confirmed via CHC 40-man roster 2026
    mlbTeamId: 112,
  },
  {
    name: '菅野 智之',
    nameEn: 'Tomoyuki Sugano',
    team: 'COL',
    type: 'pitcher',
    mlbId: 608372,   // confirmed via COL roster 2026
    mlbTeamId: 115,
  },
  {
    name: '菊池 雄星',
    nameEn: 'Yusei Kikuchi',
    team: 'LAA',
    type: 'pitcher',
    mlbId: 579328,   // confirmed via LAA roster 2026
    mlbTeamId: 108,
  },
  {
    name: '今井 達也',
    nameEn: 'Tatsuya Imai',
    team: 'HOU',
    type: 'pitcher',
    mlbId: 837227,   // confirmed via HOU roster 2026
    mlbTeamId: 117,
  },
  {
    name: 'ダルビッシュ 有',
    nameEn: 'Yu Darvish',
    team: 'SD',
    type: 'pitcher',
    mlbId: 506433,   // confirmed (MLB 2012〜)
    mlbTeamId: 135,
  },
  {
    name: '松井 裕樹',
    nameEn: 'Yuki Matsui',
    team: 'SD',
    type: 'pitcher',
    mlbId: 673513,   // confirmed via SD 40-man roster 2026
    mlbTeamId: 135,
  },
  // ===== 野手 =====
  {
    name: '吉田 正尚',
    nameEn: 'Masataka Yoshida',
    team: 'BOS',
    type: 'hitter',
    mlbId: 807799,   // confirmed via BOS roster 2026
    mlbTeamId: 111,
  },
  {
    name: '岡本 和真',
    nameEn: 'Kazuma Okamoto',
    team: 'TOR',
    type: 'hitter',
    mlbId: 672960,   // confirmed via TOR roster 2026
    mlbTeamId: 141,
  },
  {
    name: '村上 宗隆',
    nameEn: 'Munetaka Murakami',
    team: 'CWS',
    type: 'hitter',
    mlbId: 808959,   // confirmed via CWS roster 2026
    mlbTeamId: 145,
  },
  {
    name: '鈴木 誠也',
    nameEn: 'Seiya Suzuki',
    team: 'CHC',
    type: 'hitter',
    mlbId: 673548,   // confirmed via CHC 40-man roster 2026
    mlbTeamId: 112,
  },
  {
    name: 'ラーズ・ヌートバー',
    nameEn: 'Lars Nootbaar',
    team: 'STL',
    type: 'hitter',
    mlbId: 663457,   // confirmed via STL 40-man roster 2026
    mlbTeamId: 138,
  },
];

/** mlbId が有効な選手のみ（0 は未確定）*/
export const PLAYERS_WITH_ID = PLAYERS.filter(p => p.mlbId > 0);
