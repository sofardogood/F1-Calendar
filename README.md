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
