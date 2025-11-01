# F1 Calendar App

F1 2025シーズンのレース日程、ランキング、統計を表示するWebアプリケーション

## 主な機能

### レース情報
- 📅 **カレンダービュー** - 全レースの日程表示
- 🏁 **セッション詳細** - 予選・フリー走行の時間（日本時間対応）
- 🌍 **サーキット情報** - 場所、国、コース詳細

### ランキング
- 🏆 **ドライバーズスタンディングス** - リアルタイムポイント
- 🏎️ **コンストラクターズスタンディングス** - チームランキング
- 📊 **優勝までのポイント差** - 必要ポイント自動計算

### 統計
- 📈 **ポイント推移グラフ** - ドライバー・コンストラクター別
- 🔄 **自動更新機能** - 最新データを常に取得

## 🆕 最新データ自動取得機能

### 複数APIの統合
- **Ergast API** - 2005-2024年の歴史的データ
- **OpenF1 API** - 2025年以降の最新データ
- 自動的に最適なAPIを選択してデータ取得

### インテリジェントキャッシュ
- **履歴データ**: 24時間キャッシュ（変更されないため）
- **現在シーズン**: 5分間キャッシュ（頻繁に更新）
- **自動クリーンアップ**: 10分ごとに期限切れキャッシュを削除

### 新しいAPIエンドポイント

```typescript
// 最新セッション情報取得
trpc.f1.getLatestSession.useQuery()

// 最新ドライバー情報取得
trpc.f1.getLatestDrivers.useQuery()

// キャッシュを強制更新
trpc.f1.refreshCache.useMutation()

// キャッシュ統計取得
trpc.f1.getCacheStats.useQuery()
```

### フロントエンド自動更新

```typescript
// 5分ごとに自動更新
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

useAutoRefresh(() => {
  refetch(); // データ再取得
}, 5 * 60 * 1000);

// タブフォーカス時に更新
import { useRefreshOnFocus } from '@/hooks/useAutoRefresh';

useRefreshOnFocus(() => {
  refetch();
});
```

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
