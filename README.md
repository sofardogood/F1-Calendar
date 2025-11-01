# F1 Calendar App

F1 2025シーズンのレース日程、ランキング、統計を表示する静的Webアプリケーション

## 主な機能

### レース情報
- 📅 **カレンダービュー** - 全レースの日程表示
- 🏁 **セッション詳細** - 予選・フリー走行の時間（日本時間対応）
- 🌍 **サーキット情報** - 場所、国、コース詳細
- 🤖 **AI自動取得** - OpenAI APIを使って不足しているセッション情報を自動取得

### ランキング
- 🏆 **ドライバーズスタンディングス** - ポイント表示
- 🏎️ **コンストラクターズスタンディングス** - チームランキング
- 📊 **優勝までのポイント差** - 必要ポイント自動計算

### 統計
- 📈 **ポイント推移グラフ** - ドライバー・コンストラクター別
- 📊 **詳細な統計データ** - シーズン分析

## アーキテクチャ

このアプリケーションは**完全静的サイト**として構築されており、バックエンドサーバーは不要です。

### データソース
- すべてのF1データは `f1_data.json` から読み込まれます
- セッション情報がない場合、OpenAI APIを使って自動取得
- Vercel/Netlify/GitHub Pagesなど、任意の静的ホスティングで動作

### OpenAI API連携
次のレース情報で、セッション時間が不足している場合、OpenAI APIを使って以下の情報を自動取得します：
- フリー走行1〜3の日時
- 予選の日時
- 決勝の日時
- スプリントレース（該当する場合）
- レース名の日本語訳

### 環境変数設定

#### ローカル開発
`.env`ファイルに以下を設定：
```
VITE_OPENAI_API_KEY=your-openai-api-key
```

#### Vercel デプロイ
Vercel ダッシュボードで以下の環境変数を設定：
- `VITE_OPENAI_API_KEY`: OpenAI API キー

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
