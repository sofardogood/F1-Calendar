import { Link } from 'wouter';
import { Calendar, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import f1Data from '../f1_data.json';

interface RaceSession {
  name: string;
  date: string;
  time_utc: string;
  time_jst: string;
}

interface ExtendedRace {
  round: number;
  name: string;
  circuit: string;
  location: string;
  date_start: string;
  date_end: string;
  name_ja?: string;
  sessions?: RaceSession[];
}

export default function Home() {
  const drivers = f1Data.drivers_standings;
  const constructors = f1Data.constructors_standings;
  const leader = drivers[0];
  const constructorLeader = constructors[0];

  // 次のレースを取得
  const getNextRace = (): ExtendedRace => {
    const now = new Date();

    for (const race of f1Data.races) {
      const raceDate = new Date(race.date_end);
      if (raceDate >= now) {
        return race as ExtendedRace;
      }
    }
    return f1Data.races[0] as ExtendedRace; // すべてのレースが終了している場合は最初のレースを表示
  };

  const nextRace = getNextRace();

  // 優勝に必要なポイントを計算（最大ポイントは24レース × 25ポイント = 600）
  const maxPoints = 600;
  const pointsNeededDriver = Math.max(0, maxPoints - leader.points);
  const pointsNeededConstructor = Math.max(0, maxPoints - constructorLeader.points);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">F1</span>
            </div>
            <h1 className="text-2xl font-bold text-white">F1カレンダーアプリ</h1>
          </div>
          <nav className="flex gap-6">
            <Link href="/calendar">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                カレンダー
              </Button>
            </Link>
            <Link href="/standings">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                スタンディングス
              </Button>
            </Link>
            <Link href="/statistics">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                統計
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-12">
        {/* ヒーローセクション */}
        <section className="mb-16 text-center">
          <h2 className="text-5xl font-bold text-white mb-4">2025 F1シーズン</h2>
          <p className="text-xl text-slate-300 mb-8">レース日程、スタンディングス、統計情報を追跡</p>
          <div className="flex gap-4 justify-center">
            <Link href="/calendar">
              <Button size="lg" className="bg-red-600 hover:bg-red-700">
                <Calendar className="mr-2" /> カレンダーを見る
              </Button>
            </Link>
            <Link href="/standings">
              <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                <Trophy className="mr-2" /> スタンディングスを見る
              </Button>
            </Link>
          </div>
        </section>

        {/* 次のレース情報 */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-red-900/50 to-slate-800 border-red-600">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-sm font-semibold mb-2">NEXT RACE</p>
                  <CardTitle className="text-3xl text-white mb-2">{nextRace.name_ja || nextRace.name}</CardTitle>
                  <p className="text-slate-300 text-lg">{nextRace.circuit}</p>
                  <p className="text-slate-400 text-sm">{nextRace.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-sm">第{nextRace.round}戦</p>
                  <p className="text-white text-2xl font-bold mt-2">{nextRace.date_end}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {nextRace.sessions && nextRace.sessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {nextRace.sessions.map((session: RaceSession, index: number) => (
                    <div key={index} className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
                      <p className="text-slate-400 text-xs mb-1">{session.name}</p>
                      <p className="text-white font-bold text-lg">{session.time_jst}</p>
                      <p className="text-slate-300 text-sm">{session.date}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400">セッション情報はまもなく更新されます</p>
                  <p className="text-slate-500 text-sm mt-2">GitHub Actionsにより毎日自動更新</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* フィーチャーグリッド */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-slate-800 border-slate-700 hover:border-red-600 transition-colors">
            <CardHeader>
              <Calendar className="w-8 h-8 text-red-600 mb-2" />
              <CardTitle className="text-white">レースカレンダー</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">全24レースの日程、予選、フリー走行を日本時間で表示</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-red-600 transition-colors">
            <CardHeader>
              <Trophy className="w-8 h-8 text-red-600 mb-2" />
              <CardTitle className="text-white">スタンディングス</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">ドライバーとコンストラクターの現在の順位とポイント</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700 hover:border-red-600 transition-colors">
            <CardHeader>
              <TrendingUp className="w-8 h-8 text-red-600 mb-2" />
              <CardTitle className="text-white">統計情報</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">ポイント推移グラフと分析データ</p>
            </CardContent>
          </Card>
        </section>

        {/* クイック統計 */}
        <section className="bg-slate-800 border border-slate-700 rounded-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-white mb-6">2025シーズン概要</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-slate-400 text-sm">総レース数</p>
              <p className="text-3xl font-bold text-white">24</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">スプリントレース</p>
              <p className="text-3xl font-bold text-white">6</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">チーム数</p>
              <p className="text-3xl font-bold text-white">10</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">ドライバー数</p>
              <p className="text-3xl font-bold text-white">20</p>
            </div>
          </div>
        </section>

        {/* 優勝までの必要ポイント */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">ドライバーズチャンピオンシップ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-2">現在のリーダー</p>
                <p className="text-2xl font-bold text-white">{leader.name}</p>
                <p className="text-slate-300 text-sm">{leader.team}</p>
              </div>
              <div className="bg-slate-700 rounded p-4">
                <p className="text-slate-400 text-sm mb-1">現在のポイント</p>
                <p className="text-3xl font-bold text-red-600">{leader.points}</p>
              </div>
              <div className="bg-slate-700 rounded p-4 border-l-4 border-green-500">
                <p className="text-slate-400 text-sm mb-1">優勝に必要なポイント</p>
                <p className="text-3xl font-bold text-green-500">{pointsNeededDriver}</p>
                <p className="text-slate-400 text-xs mt-2">あと{pointsNeededDriver}ポイントで優勝確定</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">コンストラクターズチャンピオンシップ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-2">現在のリーダー</p>
                <p className="text-2xl font-bold text-white">{constructorLeader.name}</p>
              </div>
              <div className="bg-slate-700 rounded p-4">
                <p className="text-slate-400 text-sm mb-1">現在のポイント</p>
                <p className="text-3xl font-bold text-blue-600">{constructorLeader.points}</p>
              </div>
              <div className="bg-slate-700 rounded p-4 border-l-4 border-green-500">
                <p className="text-slate-400 text-sm mb-1">優勝に必要なポイント</p>
                <p className="text-3xl font-bold text-green-500">{pointsNeededConstructor}</p>
                <p className="text-slate-400 text-xs mt-2">あと{pointsNeededConstructor}ポイントで優勝確定</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
