'use client';

import { useState, useEffect } from 'react';
import type { PlayerResult, SeasonStats } from '@/lib/types';

// ---- ヘルパー ----

function initials(name: string): string {
  return name.replace(/[・\s]/g, '').substring(0, 2);
}

function DecBadge({ dec }: { dec: 'W' | 'L' | 'S' | null | undefined }) {
  if (dec === 'W') return <span className="badge b-win">勝投</span>;
  if (dec === 'L') return <span className="badge b-loss">敗投</span>;
  if (dec === 'S') return <span className="badge b-save">S</span>;
  return <span className="badge b-nd">ND</span>;
}

// ---- 今日の結果タブ ----

function TodayTab({ players }: { players: PlayerResult[] }) {
  const played    = players.filter(p => !p.noGame);
  const notPlayed = players.filter(p =>  p.noGame);
  const pitchers  = played.filter(p => (p.type === 'pitcher' || p.type === 'both') && p.pit);
  const hitters   = played.filter(p => (p.type === 'hitter'  || p.type === 'both') && p.hit);

  return (
    <div className="table-wrap">
      {/* 野手 */}
      <div className="section-sep">
        <span>野手</span>
        <span style={{ fontWeight: 400, color: '#aaa' }}>{hitters.length}人が出場</span>
      </div>
      <table className="result-table">
        <thead>
          <tr>
            <th className="left" style={{ paddingLeft: 4 }}>選手</th>
            <th>試合</th><th>チーム勝敗</th>
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

      {/* 投手 */}
      <div className="section-sep" style={{ marginTop: '1rem' }}>
        <span>投手</span>
        <span style={{ fontWeight: 400, color: '#aaa' }}>{pitchers.length}人が登板</span>
      </div>
      <table className="result-table">
        <thead>
          <tr>
            <th className="left" style={{ paddingLeft: 4 }}>選手</th>
            <th>試合</th><th>チーム勝敗</th>
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
          <div key={p.nameEn} style={{ fontSize: 12, color: '#999', background: '#f5f5f5', borderRadius: 99, padding: '4px 12px' }}>
            {p.name} <span style={{ opacity: .6 }}>{p.team}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- 通算成績タブ ----

type StatsMap = Map<string, SeasonStats | 'error'>;

function SeasonHitterRow({ player, stats }: { player: PlayerResult; stats: SeasonStats | 'error' | undefined }) {
  const s = (stats && stats !== 'error' ? stats : {}) as Record<string, unknown>;
  const isPitcher = player.type === 'both';
  const gKey = isPitcher ? 'hitG' : 'G';
  const loading = stats === undefined;

  return (
    <tr>
      <td className="left">
        <div className="player-cell">
          <div className="av av-h">{initials(player.name)}</div>
          <div>
            <div className="pname">{player.name}</div>
            <div className="pteam">{player.team}</div>
          </div>
        </div>
      </td>
      {loading ? (
        <td colSpan={10} style={{ color: '#aaa', fontSize: 12 }}>
          <span className="spinner-sm" style={{ display: 'inline-block', marginRight: 4 }} />取得中
        </td>
      ) : stats === 'error' ? (
        <td colSpan={10} style={{ color: '#aaa', fontSize: 12 }}>—</td>
      ) : (
        <>
          <td>{(s[gKey] as number) ?? '—'}</td>
          <td>{(s.AB as number) ?? '—'}</td>
          <td className={(s.H as number) >= 100 ? 'hi' : ''}>{(s.H as number) ?? '—'}</td>
          <td className={(s.HR as number) > 0 ? 'hi' : ''}>{(s.HR as number) ?? '—'}</td>
          <td className={(s.RBI as number) >= 50 ? 'hi' : ''}>{(s.RBI as number) ?? '—'}</td>
          <td>{(s.R as number) ?? '—'}</td>
          <td>{(s.SB as number) ?? '—'}</td>
          <td style={{ fontSize: 12, color: '#888' }}>{(s.AVG as string) ?? '—'}</td>
          <td style={{ fontSize: 12, color: '#888' }}>{(s.OBP as string) ?? '—'}</td>
          <td className={parseFloat(s.OPS as string) > 0.9 ? 'hi' : ''} style={{ fontSize: 12 }}>{(s.OPS as string) ?? '—'}</td>
        </>
      )}
    </tr>
  );
}

function SeasonPitcherRow({ player, stats }: { player: PlayerResult; stats: SeasonStats | 'error' | undefined }) {
  const s = (stats && stats !== 'error' ? stats : {}) as Record<string, unknown>;
  const loading = stats === undefined;

  return (
    <tr>
      <td className="left">
        <div className="player-cell">
          <div className="av av-p">{initials(player.name)}</div>
          <div>
            <div className="pname">{player.name}</div>
            <div className="pteam">{player.team}</div>
          </div>
        </div>
      </td>
      {loading ? (
        <td colSpan={9} style={{ color: '#aaa', fontSize: 12 }}>
          <span className="spinner-sm" style={{ display: 'inline-block', marginRight: 4 }} />取得中
        </td>
      ) : stats === 'error' ? (
        <td colSpan={9} style={{ color: '#aaa', fontSize: 12 }}>—</td>
      ) : (
        <>
          <td>{(s.G as number) ?? '—'}</td>
          <td>{(s.W as number) ?? '—'}</td>
          <td>{(s.L as number) ?? '—'}</td>
          <td>{(s.SV as number) ?? '—'}</td>
          <td>{(s.IP as string) ?? '—'}</td>
          <td className={parseFloat(s.ERA as string) < 3 ? 'hi' : parseFloat(s.ERA as string) > 5 ? 'danger' : ''}>
            {(s.ERA as string) ?? '—'}
          </td>
          <td>{(s.WHIP as string) ?? '—'}</td>
          <td className={(s.K as number) >= 100 ? 'hi' : ''}>{(s.K as number) ?? '—'}</td>
          <td>{(s.BB as number) ?? '—'}</td>
        </>
      )}
    </tr>
  );
}

function SeasonTab({ players, season }: { players: PlayerResult[]; season: number }) {
  const [statsMap, setStatsMap] = useState<StatsMap>(new Map());
  const [fetched, setFetched] = useState(false);

  // タブを開いた瞬間に全員分を並列取得
  useEffect(() => {
    if (fetched) return;
    setFetched(true);

    players.forEach(async p => {
      if (p.mlbId === 0) {
        setStatsMap(prev => new Map(prev).set(p.nameEn, 'error'));
        return;
      }
      try {
        const res = await fetch(`/api/season?playerId=${p.mlbId}&season=${season}`);
        const data: SeasonStats = await res.json();
        setStatsMap(prev => new Map(prev).set(p.nameEn, res.ok ? data : 'error'));
      } catch {
        setStatsMap(prev => new Map(prev).set(p.nameEn, 'error'));
      }
    });
  }, [fetched, players, season]);

  // 野手：hitter + both（大谷は野手テーブルにも）
  const hitters  = players.filter(p => p.type === 'hitter' || p.type === 'both');
  // 投手：pitcher + both（大谷は投手テーブルにも）
  const pitchers = players.filter(p => p.type === 'pitcher' || p.type === 'both');

  return (
    <div className="table-wrap">
      {/* 野手 */}
      <div className="section-sep">
        <span>野手</span>
        <span style={{ fontWeight: 400, color: '#aaa' }}>通算成績 {season}</span>
      </div>
      <table className="result-table">
        <thead>
          <tr>
            <th className="left" style={{ paddingLeft: 4 }}>選手</th>
            <th>試合</th><th>打数</th><th>安打</th><th>本塁打</th>
            <th>打点</th><th>得点</th><th>盗塁</th><th>打率</th><th>出塁率</th><th>OPS</th>
          </tr>
        </thead>
        <tbody>
          {hitters.map(p => (
            <SeasonHitterRow key={p.nameEn} player={p} stats={statsMap.get(p.nameEn)} />
          ))}
        </tbody>
      </table>

      {/* 投手 */}
      <div className="section-sep" style={{ marginTop: '1rem' }}>
        <span>投手</span>
        <span style={{ fontWeight: 400, color: '#aaa' }}>通算成績 {season}</span>
      </div>
      <table className="result-table">
        <thead>
          <tr>
            <th className="left" style={{ paddingLeft: 4 }}>選手</th>
            <th>登板</th><th>勝</th><th>敗</th><th>S</th>
            <th>投球回</th><th>防御率</th><th>WHIP</th><th>K</th><th>BB</th>
          </tr>
        </thead>
        <tbody>
          {pitchers.map(p => (
            <SeasonPitcherRow key={p.nameEn} player={p} stats={statsMap.get(p.nameEn)} />
          ))}
        </tbody>
      </table>
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
