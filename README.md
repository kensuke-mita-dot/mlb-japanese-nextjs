# MLB 日本人選手 デイリー

毎日 URL を開くだけで、その日の日本人選手の試合結果と通算成績が確認できる Next.js アプリです。

## 機能

- **本日の結果タブ**: 当日の投手・野手成績を自動表示
- **通算成績タブ**: クリックで MLB Stats API からリアルタイム取得
- **毎日自動更新**: Vercel Cron Jobs が UTC 05:00 (JST 14:00) に実行
- **APIキー保護**: Anthropic API はサーバーサイドプロキシ経由

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js 14 (App Router) |
| 言語 | TypeScript |
| データソース | MLB Stats API (無料・認証不要) |
| キャッシュ | Vercel KV (Redis) / メモリ (ローカル) |
| コメント生成 | Anthropic API (任意) |
| ホスティング | Vercel |
| 定期実行 | Vercel Cron Jobs |

## ローカル開発

```bash
cd mlb-japanese-nextjs
npm install
cp .env.local.example .env.local
# .env.local を編集（最低限の設定なしでも起動可能）
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

## Vercel へのデプロイ

### 1. Vercel KV を作成

Vercel ダッシュボード → Storage → Create Database → KV

プロジェクトにリンクすると環境変数 (`KV_REST_API_URL` / `KV_REST_API_TOKEN`) が自動設定されます。

### 2. 環境変数を設定

Vercel ダッシュボード → Settings → Environment Variables:

| 変数名 | 説明 | 必須 |
|---|---|---|
| `CRON_SECRET` | Cron 認証トークン (任意の文字列) | 推奨 |
| `ANTHROPIC_API_KEY` | Claude API キー | 任意 |

### 3. デプロイ

```bash
npx vercel --prod
```

`vercel.json` の設定により Cron Job が自動登録されます。

### 4. Cron スケジュール

`vercel.json` の schedule を調整可能です:

| schedule (UTC) | JST | 用途 |
|---|---|---|
| `0 5 * * *` | 14:00 | デフォルト (東海岸ナイターまで対応) |
| `0 8 * * *` | 17:00 | 西海岸ナイターも確実に含める |

> **注意**: UTC 05:00 時点では西海岸の深夜試合 (Pacific 22:00 終了予定) がまだ進行中の場合があります。
> より確実にするには `0 8 * * *` (UTC) をお勧めします。

## MLB 選手 ID の確認・更新

`lib/players.ts` の `mlbId` は一部推定値を含みます。正確な ID は以下で確認できます:

```bash
# チームのロスターから選手 ID を確認 (例: LAD=119)
curl "https://statsapi.mlb.com/api/v1/teams/119/roster?season=2026" \
  | python3 -c "import sys,json; [print(p['person']['id'], p['person']['fullName']) for p in json.load(sys.stdin)['roster']]"
```

チーム ID 一覧:
- LAD: 119 / NYM: 121 / CHC: 112 / COL: 115 / LAA: 108
- HOU: 117 / SD: 135 / BOS: 111 / TOR: 141 / CWS: 145 / STL: 138

## ファイル構成

```
mlb-japanese-nextjs/
├── app/
│   ├── layout.tsx           # ルートレイアウト
│   ├── globals.css          # スタイル (元HTMLから移植)
│   ├── page.tsx             # メインページ (サーバーコンポーネント)
│   └── api/
│       ├── today/route.ts   # GET /api/today — 今日の成績
│       ├── season/route.ts  # GET /api/season — 通算成績プロキシ
│       └── cron/route.ts    # GET /api/cron — 毎日の自動取得
├── components/
│   └── Widget.tsx           # インタラクティブ UI (クライアント)
├── lib/
│   ├── types.ts             # TypeScript 型定義
│   ├── players.ts           # 選手マスタ (MLB ID 含む)
│   ├── mlb.ts               # MLB Stats API 呼び出し
│   └── cache.ts             # KV / メモリキャッシュ抽象層
├── vercel.json              # Cron Job 設定
└── .env.local.example       # 環境変数サンプル
```
