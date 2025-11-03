# F1 Calendar App

F1 2025シーズンのレース日程、ランキング、統計を表示する静的Webアプリケーション

## 主な機能

### レース情報
- 📅 **カレンダービュー** - 全レースの日程表示
- 🏁 **セッション詳細** - 予選・フリー走行の時間（日本時間対応）
- 🌍 **サーキット情報** - 場所、国、コース詳細
- 🔄 **自動更新** - GitHub Actionsで毎日自動的に最新情報を取得

### ランキング
- 🏆 **ドライバーズスタンディングス** - ポイント表示
- 🏎️ **コンストラクターズスタンディングス** - チームランキング
- 📊 **優勝までのポイント差** - 必要ポイント自動計算

### 統計
- 📈 **ポイント推移グラフ** - ドライバー・コンストラクター別
- 📊 **詳細な統計データ** - シーズン分析

## アーキテクチャ

このアプリケーションは**完全静的サイト**として構築されており、バックエンドサーバーは不要です。

### データ更新システム

#### 1. GitHub Actions による自動更新
- **頻度**: 毎日午前3時（UTC）に自動実行
- **手動実行**: GitHub Actionsページから手動実行も可能
- **処理内容**:
  1. F1Pro日本語サイト（f1pro.sub.jp）から最新スケジュールをスクレイピング
  2. `client/src/f1_data.json`を自動更新
  3. 変更をGitHubリポジトリにコミット
  4. Vercelが自動的に再デプロイ

#### 2. データソース
- **メインデータ**: `client/src/f1_data.json`
- **スクレイピング先**: https://f1pro.sub.jp/2625/
- **バックアップ**: フォールバック用のハードコードデータ

### 手動でデータを更新する方法

```bash
# ローカルでスクレイピングを実行
pnpm tsx server/scripts/updateF1Data.ts

# 変更をコミット
git add client/src/f1_data.json
git commit -m "update: F1スケジュールデータを手動更新"
git push
```

### 年度別データ管理（過去データのアーカイブ）

シーズン終了時に、現在のシーズンデータをCSV形式で保存します。

#### 1. CSVファイル形式

各年度のデータは3つのCSVファイルに分割されます：

```
F1-2025-races.csv      # レース基本情報（名前、サーキット、日程）
F1-2025-sessions.csv   # セッション情報（FP1, FP2, 予選, レース）
F1-2025-results.csv    # レース結果（順位、ドライバー、ポイント）
```

**races.csv の形式:**
```csv
round,race_name,race_name_ja,circuit,location,date_start,date_end
1,Australian Grand Prix,オーストラリアGP,Albert Park Circuit,"Melbourne, Australia",2025-03-14,2025-03-16
```

**sessions.csv の形式:**
```csv
round,session_name,session_date,time_utc,time_jst
1,Free Practice 1,2025-03-14,01:30,10:30
1,Qualifying,2025-03-15,05:00,14:00
1,Race,2025-03-16,04:00,13:00
```

**results.csv の形式:**
```csv
round,position,driver_code,driver_name,team,points,grid,laps,time,status
1,1,VER,Max Verstappen,Red Bull,25,1,58,1:42:06.304,Finished
1,2,NOR,Lando Norris,McLaren,18,2,58,+2.500,Finished
```

#### 2. 年度データのエクスポート

```bash
# 例: 2025年シーズンのデータをCSVにエクスポート
pnpm tsx server/scripts/exportYearToCSV.ts 2025

# → 以下の3ファイルが生成される
# F1-2025-races.csv
# F1-2025-sessions.csv
# F1-2025-results.csv
```

#### 3. CSVからデータをインポート

```bash
# 例: 2020年のCSVデータをインポート
pnpm tsx server/scripts/parseYearlyCSV.ts 2020

# → client/src/f1_data.json の races_by_year[2020] に追加される
```

#### 4. データ構造

アプリケーションは年度別にデータを管理します:
- `races_by_year[2025]`: 2025年のレースデータ
- `races_by_year[2024]`: 2024年のレースデータ
- `races_by_year[2020]`: 2020年のレースデータ

#### 5. 来年（2026年）への移行手順

2025年シーズン終了後、2026年に移行する手順:

```bash
# 1. 2025年のデータをCSVにエクスポート
pnpm tsx server/scripts/exportYearToCSV.ts 2025

# 2. CSVファイルをリポジトリに追加
git add F1-2025-*.csv
git commit -m "archive: 2025シーズンデータをCSVアーカイブ"

# 3. f1_data.json の current_season を 2026 に更新
# (手動で編集)

# 4. 2026年の新しいデータをスクレイピング
pnpm tsx server/scripts/updateF1Data.ts

git push
```

#### 6. 手動でのデータ編集

CSVファイルはExcelやGoogle Sheetsで直接編集できます：

1. CSVファイルを編集（例: F1-2025-results.csv）
2. 保存
3. インポートコマンドで反映:
   ```bash
   pnpm tsx server/scripts/parseYearlyCSV.ts 2025
   ```

これにより、過去のデータ(2020, 2024, 2025など)を保持しながら、新しいシーズン(2026)のデータを追加できます。

### 環境変数設定

#### GitHub Secrets（GitHub Actions用）
リポジトリの Settings > Secrets and variables > Actions で設定：
- `OPENAI_API_KEY`: OpenAI API キー（HTMLパース用、オプション）

#### Vercel環境変数（フロントエンド用）
- `VITE_OPENAI_API_KEY`: OpenAI API キー（クライアントサイドで使用、現在は非推奨）

## 技術スタック

### フロントエンド
- **React 19** - UIフレームワーク
- **TypeScript** - 型安全な開発
- **Vite** - 高速ビルドツール
- **TailwindCSS** - スタイリング
- **Radix UI** - アクセシブルなUIコンポーネント
- **TanStack Query** - データフェッチング・キャッシング
- **tRPC** - 型安全なAPI通信

### バックエンド
- **Express** - Node.jsサーバー
- **tRPC Server** - API定義
- **Drizzle ORM** - データベース操作
- **MySQL2** - データベース

### 外部API
- **Ergast F1 API** - 歴史的F1データ
- **OpenF1 API** - 最新F1データ

## セットアップ

### 1. リポジトリをクローン

```bash
git clone https://github.com/sofardogood/F1-Calendar.git
cd F1-Calendar
```

### 2. 依存関係をインストール

```bash
pnpm install
```

### 3. 環境変数を設定

`.env`ファイルを作成：

```bash
# OpenAI API Key（オプション）
OPENAI_API_KEY=your_openai_api_key

# その他の環境変数（必要に応じて）
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
```

### 4. 開発サーバーを起動

```bash
pnpm dev
```

http://localhost:3000 でアプリケーションが起動します。

## デプロイ

### Vercelへのデプロイ

1. GitHubリポジトリにプッシュ
2. [Vercel](https://vercel.com)にアクセス
3. プロジェクトをインポート
4. 環境変数を設定
5. デプロイ

詳細は[vercel.json](vercel.json)を参照してください。

### ビルド

```bash
pnpm build
```

ビルドされたファイルは`dist/public`に出力されます。

### 本番環境で実行

```bash
pnpm start
```

## スクリプト

```bash
pnpm dev          # 開発サーバー起動
pnpm build        # 本番ビルド
pnpm start        # 本番サーバー起動
pnpm check        # TypeScript型チェック
pnpm format       # コードフォーマット
pnpm test         # テスト実行
pnpm db:push      # データベースマイグレーション
```

## プロジェクト構造

```
F1-Calendar/
├── client/              # フロントエンド
│   ├── src/
│   │   ├── pages/      # ページコンポーネント
│   │   ├── components/ # 再利用可能なコンポーネント
│   │   ├── hooks/      # カスタムフック
│   │   └── lib/        # ユーティリティ
│   └── public/         # 静的ファイル
├── server/             # バックエンド
│   ├── _core/          # コア機能
│   ├── services/       # 外部API連携
│   │   ├── ergastService.ts    # Ergast API
│   │   ├── openF1Service.ts    # OpenF1 API
│   │   ├── cacheService.ts     # キャッシュ管理
│   │   └── f1DataService.ts    # 統合データサービス
│   └── routers.ts      # tRPCルーター
├── shared/             # 共有型定義
├── api/                # Vercelサーバーレス関数
└── drizzle/            # データベーススキーマ
```

## 使用方法

### ページナビゲーション

- **ホーム** - 現在のリーダーと統計概要
- **カレンダー** - 全レース日程と詳細
- **スタンディングス** - ドライバー・コンストラクターランキング
- **統計** - ポイント推移グラフ

### データ更新

各ページで「更新」ボタンをクリックすることで、最新データを取得できます。
また、5分ごとに自動的にデータが更新されます。

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します！

1. フォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを開く

## サポート

問題が発生した場合は、[Issues](https://github.com/sofardogood/F1-Calendar/issues)で報告してください。
