'use client';

import { useState, useCallback } from 'react';
import type { PlayerResult, SeasonStats } from '@/lib/types';

// ---- ヘルパー ----

function initials(name: string): string {
  return name.replace(/[・\s]/g, '').substring(0, 2);
}

function DecBadge({ dec }: { dec: 'W' | 'L' | 'S' | null | undefined }) {
  if (dec === 'W') return <span className="badge b-win">勝投</span>;
  if (dec === 'L') return <span className="badge b-loss">敗投</span>;
  if (dec === 'S') return <span className="badge b-save">S</span>;
  // ND (登板したが勝敗セーブなし)
  return <span className="badge b-nd">ND</span>;
}

// ---- 今日の結果タブ ----

function TodayTab({ players }: { players: PlayerResult[] }) {
  const played    = players.filter(p => !p.noGame);
  const notPlayed = players.filter(p =>  p.noGame);
  // 二刀流は投球した日だけ投手テーブルに表示
  const pitchers  = played.filter(p => (p.type === 'pitcher' || p.type === 'both') && p.pit);
  // 二刀流は打撃成績があれば野手テーブルにも表示
  const hitters   = played.filter(p => (p.type === 'hitter' || p.type === 'both') && p.hit);

  return (
    <div className="table-wrap">
      {/* 野手（上に移動） */}
      <div className="section-sep">
        <span>野手</span>
        <span style={{ fontWeight: 400, color: '#aaa' }}>{hitters.length}人が出場</span>
      </div>
      <table className="result-table">
        <thead>
          <tr>
            <th className="left" style={{ paddingLeft: 4 }}>選手</th>
            <th>試合</th><th>勝敗</th>
            <th>打数</th><th>安打</th><th>本塁打</th><th>打点</th><th>得点</th><th>二塁打</th><th>打率</th>
          </tr>
        </thead>
        <tbody>
          {hitters.map(p => {
            const h = p.hit ?? ({} as Partial<NonNullable<PlayerResult['hit']>>);
            const resClass = p.res === 'W' ? 'result-w' : 'result-l';
            return (
              <tr key={p.nameEn}>
                <td className="left">
                  <div className="player-cell">
                    <div className="av av-h">{initials(p.name)}</div>
                    <div>
                      <div className="pname">{p.name}</div>
                      <div className="pteam">{p.team}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>{p.game ?? '—'}</td>
                <td className={resClass}>{p.res === 'W' ? '勝' : '敗'}</td>
                <td>{h.AB ?? '—'}</td>
                <td className={(h.H ?? 0) >= 3 ? 'hi' : ''}>{h.H ?? '—'}</td>
                <td className={(h.HR ?? 0) > 0 ? 'hi' : ''}>{h.HR ?? '—'}</td>
                <td className={(h.RBI ?? 0) >= 3 ? 'hi' : ''}>{h.RBI ?? '—'}</td>
                <td>{h.R ?? '—'}</td>
                <td>{h['2B'] ?? '—'}</td>
                <td style={{ fontSize: 12, color: '#888' }}>{p.hitAvg ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 投手（下に移動） */}
      <div className="section-sep" style={{ marginTop: '1rem' }}>
        <span>投手</span>
        <span style={{ fontWeight: 400, color: '#aaa' }}>{pitchers.length}人が登板</span>
      </div>
      <table className="result-table">
        <thead>
          <tr>
            <th className="left" style={{ paddingLeft: 4 }}>選手</th>
            <th>試合</th><th>勝敗</th>
            <th>投球回</th><th>K</th><th>BB</th><th>被安打</th><th>失点</th><th>防御率</th><th>判定</th>
          </tr>
        </thead>
        <tbody>
          {pitchers.map(p => {
            const pit = p.pit ?? ({} as Partial<NonNullable<PlayerResult['pit']>>);
            const erCls = (pit.ER ?? 0) >= 5 ? 'danger' : '';
            const kCls  = (pit.K  ?? 0) >= 7 ? 'hi'     : '';
            const resClass = p.res === 'W' ? 'result-w' : 'result-l';
            return (
              <tr key={p.nameEn}>
                <td className="left">
                  <div className="player-cell">
                    <div className="av av-p">{initials(p.name)}</div>
                    <div>
                      <div className="pname">{p.name}</div>
                      <div className="pteam">{p.team}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>{p.game ?? '—'}</td>
                <td className={resClass}>{p.res === 'W' ? '勝' : '敗'}</td>
                <td>{pit.IP ?? '—'}</td>
                <td className={kCls}>{pit.K ?? '—'}</td>
                <td>{pit.BB ?? '—'}</td>
                <td>{pit.H ?? '—'}</td>
                <td className={erCls}>{pit.ER ?? '—'}</td>
                <td className={erCls}>{pit.ERA ?? '—'}</td>
                <td>{p.dec !== undefined ? <DecBadge dec={p.dec} /> : null}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 出場なし */}
      <div className="section-sep" style={{ marginTop: '1rem' }}>
        <span>本日出場なし</span>
        <span style={{ fontWeight: 400, color: '#aaa' }}>{notPlayed.length}人</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingTop: 8 }}>
        {notPlayed.map(p => (
          <div
            key={p.nameEn}
            style={{
              fontSize: 12,
              color: '#999',
              background: '#f5f5f5',
              borderRadius: 99,
              padding: '4px 12px',
            }}
          >
            {p.name} <span style={{ opacity: .6 }}>{p.team}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- 通算成績タブ ----

function SeasonStatGrid({ stats }: { stats: SeasonStats }) {
  const isPitcher = stats.type === 'pitcher' || stats.type === 'both';
  const isHitter  = stats.type === 'hitter'  || stats.type === 'both';
  const s = stats as unknown as Record<string, unknown>;

  return (
    <>
      {'seasonNote' in stats && stats.seasonNote && (
        <div style={{ fontSize: 12, color: '#666', marginBottom: 10, paddingBottom: 8, borderBottom: '0.5px solid #eee' }}>
          {stats.seasonNote}
        </div>
      )}
      {isPitcher && (
        <>
          <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
            投手成績 ({new Date().getFullYear()})
          </div>
          <div className="season-grid">
            {([
              ['登板', 'G'], ['勝', 'W'], ['敗', 'L'], ['S', 'SV'],
              ['投球回', 'IP'], ['防御率', 'ERA'], ['WHIP', 'WHIP'],
              ['K', 'K'], ['BB', 'BB'],
            ] as [string, string][]).map(([lbl, key]) => {
              const val = s[key] as string | number | undefined;
              const cls = lbl === '防御率'
                ? (parseFloat(String(val)) < 3 ? 'hi' : parseFloat(String(val)) > 5 ? 'danger' : '')
                : '';
              return (
                <div className="sstat" key={key}>
                  <div className="sstat-lbl">{lbl}</div>
                  <div className={`sstat-val ${cls}`}>{val ?? '—'}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
      {isHitter && (
        <>
          {isPitcher && <div style={{ height: 12 }} />}
          <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6, marginTop: 4 }}>
            打撃成績 ({new Date().getFullYear()})
          </div>
          <div className="season-grid">
            {([
              // 二刀流は hitG（打者出場数）、純野手は G を使う
              ['試合', isPitcher ? 'hitG' : 'G'], ['打数', 'AB'], ['安打', 'H'], ['本塁打', 'HR'],
              ['打点', 'RBI'], ['得点', 'R'], ['盗塁', 'SB'],
              ['打率', 'AVG'], ['出塁率', 'OBP'], ['長打率', 'SLG'], ['OPS', 'OPS'],
            ] as [string, string][]).filter(([, key]) => s[key] !== undefined).map(([lbl, key]) => {
              const val = s[key] as string | number | undefined;
              const cls = lbl === 'OPS' && parseFloat(String(val)) > .9
                ? 'hi'
                : lbl === '本塁打' && parseInt(String(val)) > 0
                  ? 'hi'
                  : '';
              return (
                <div className="sstat" key={key}>
                  <div className="sstat-lbl">{lbl}</div>
                  <div className={`sstat-val ${cls}`}>{val ?? '—'}</div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function PlayerSeasonRow({
  player,
  index,
  season,
}: {
  player: PlayerResult;
  index: number;
  season: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SeasonStats | null>(null);
  const [error, setError] = useState('');

  const toggle = useCallback(async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (stats || error) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/season?playerId=${player.mlbId}&season=${season}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'エラー');
      }
      setStats(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'データを取得できませんでした');
    } finally {
      setLoading(false);
    }
  }, [open, stats, error, player.mlbId, season]);

  const isPit = player.type === 'pitcher' || player.type === 'both';
  const typeLabel = player.type === 'both' ? '二刀流' : isPit ? '投手' : '野手';

  return (
    <div className={`player-row${open ? ' open' : ''}`} id={`row-${index}`}>
      <div className="player-row-header" onClick={toggle}>
        <div className={`av ${isPit ? 'av-p' : 'av-h'}`}>{initials(player.name)}</div>
        <div style={{ flex: 1 }}>
          <div className="pname">{player.name}</div>
          <div className="pteam">{player.team} · {typeLabel}</div>
        </div>
        <span
          className="expand-icon"
          style={{ transform: open ? 'rotate(180deg)' : undefined }}
        >
          ▾
        </span>
      </div>
      {open && (
        <div className="season-stats">
          {loading && (
            <div className="loading-inline">
              <span className="spinner-sm" />
              取得中...
            </div>
          )}
          {error && (
            <div style={{ fontSize: 12, color: '#aaa', padding: '8px 0' }}>{error}</div>
          )}
          {stats && <SeasonStatGrid stats={stats} />}
        </div>
      )}
    </div>
  );
}

function SeasonTab({ players, season }: { players: PlayerResult[]; season: number }) {
  return (
    <div className="player-list">
      {players.map((p, i) => (
        <PlayerSeasonRow key={p.nameEn} player={p} index={i} season={season} />
      ))}
    </div>
  );
}

// ---- メインウィジェット ----

export default function Widget({
  initialPlayers,
  date,
}: {
  initialPlayers: PlayerResult[];
  date: string;
}) {
  const [activeTab, setActiveTab] = useState<'today' | 'season'>('today');

  // date: YYYY-MM-DD (Eastern)
  const [yyyy, mm, dd] = date.split('-');
  const dateLabel = `${yyyy}年${parseInt(mm)}月${parseInt(dd)}日 (Eastern) · 全試合スキャン済み`;
  const season = parseInt(yyyy, 10);

  return (
    <>
      <div className="header">
        <h1>MLB 日本人選手</h1>
        <div className="header-sub">
          <span className="date-info">{dateLabel}</span>
          <span className="date-info" style={{ color: '#aaa', fontSize: 11 }}>
            スポーツナビ掲載15選手
          </span>
        </div>
      </div>

      <div className="top-tabs">
        <button
          className={`top-tab${activeTab === 'today' ? ' active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          本日の結果
        </button>
        <button
          className={`top-tab${activeTab === 'season' ? ' active' : ''}`}
          onClick={() => setActiveTab('season')}
        >
          通算成績
        </button>
      </div>

      {activeTab === 'today' && <TodayTab players={initialPlayers} />}
      {activeTab === 'season' && (
        <SeasonTab players={initialPlayers} season={season} />
      )}
    </>
  );
}
