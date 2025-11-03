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
  round: number | string;
  name: string;
  circuit: string;
  location: string;
  date_start: string;
  date_end: string;
  name_ja?: string;
  sessions?: RaceSession[];
}

interface F1Data {
  races_by_year?: Record<string, ExtendedRace[]>;
  current_season?: number;
  races?: ExtendedRace[];
  drivers_standings: any[];
  constructors_standings: any[];
}

export default function Home() {
  const data = f1Data as F1Data;
  const drivers = data.drivers_standings;
  const constructors = data.constructors_standings;
  const leader = drivers[0];
  const constructorLeader = constructors[0];

  // 現在シーズンのレースデータを取得
  const currentSeasonRaces = data.races_by_year?.[data.current_season || 2025] || data.races || [];

  // 次のレースを取得
  const getNextRace = (): ExtendedRace => {
    const now = new Date();

    for (const race of currentSeasonRaces) {
      const raceDate = new Date(race.date_end);
      if (raceDate >= now) {
        return race as ExtendedRace;
      }
    }
    return currentSeasonRaces[0] as ExtendedRace; // すべてのレースが終了している場合は最初のレースを表示
  };

  const nextRace = getNextRace();

  // レース統計を計算
  const mainRaces = currentSeasonRaces.filter(r => !String(r.round).includes('-S'));
  const sprintRaces = currentSeasonRaces.filter(r => String(r.round).includes('-S'));

  // 優勝に必要なポイントを計算（最大ポイントは24レース × 25ポイント = 600）
  const maxPoints = 600;
  const pointsNeededDriver = Math.max(0, maxPoints - leader.points);
  const pointsNeededConstructor = Math.max(0, maxPoints - constructorLeader.points);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* ヘッダー */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm md:text-base">F1</span>
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-white">F1カレンダー</h1>
          </div>
          <nav className="flex gap-2 md:gap-6">
            <Link href="/calendar">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-xs md:text-sm px-2 md:px-4">
                カレンダー
              </Button>
            </Link>
            <Link href="/standings">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-xs md:text-sm px-2 md:px-4">
                順位
              </Button>
            </Link>
            <Link href="/statistics">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-xs md:text-sm px-2 md:px-4">
                統計
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-6 md:py-12">
        {/* ヒーローセクション */}
        <section className="mb-8 md:mb-16 text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-2 md:mb-4">2025 F1シーズン</h2>
          <p className="text-sm md:text-xl text-slate-300 mb-6 md:mb-8">レース日程、順位、統計情報を追跡</p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link href="/calendar">
              <Button size="lg" className="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
                <Calendar className="mr-2 w-4 h-4 md:w-5 md:h-5" /> カレンダーを見る
              </Button>
            </Link>
            <Link href="/standings">
              <Button size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800 w-full sm:w-auto">
                <Trophy className="mr-2 w-4 h-4 md:w-5 md:h-5" /> 順位を見る
              </Button>
            </Link>
          </div>
        </section>

        {/* 次のレース情報 */}
        <section className="mb-8 md:mb-16">
          <Card className="bg-gradient-to-r from-red-900/50 to-slate-800 border-red-600">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <p className="text-red-400 text-xs md:text-sm font-semibold mb-1 md:mb-2">NEXT RACE</p>
                  <CardTitle className="text-xl md:text-3xl text-white mb-1 md:mb-2">{nextRace.name_ja || nextRace.name}</CardTitle>
                  <p className="text-slate-300 text-sm md:text-lg">{nextRace.circuit}</p>
                  <p className="text-slate-400 text-xs md:text-sm">{nextRace.location}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-slate-400 text-xs md:text-sm">第{nextRace.round}戦</p>
                  <p className="text-white text-lg md:text-2xl font-bold mt-1 md:mt-2">{nextRace.date_end}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {nextRace.sessions && nextRace.sessions.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
                  {nextRace.sessions.map((session: RaceSession, index: number) => (
                    <div key={index} className="bg-slate-800/80 rounded-lg p-2 md:p-4 border border-slate-700">
                      <p className="text-slate-400 text-xs mb-1">{session.name}</p>
                      <p className="text-white font-bold text-sm md:text-lg">{session.time_jst}</p>
                      <p className="text-slate-300 text-xs md:text-sm">{session.date}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm md:text-base">セッション情報はまもなく更新されます</p>
                  <p className="text-slate-500 text-xs md:text-sm mt-2">GitHub Actionsにより毎日自動更新</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* フィーチャーグリッド */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-16">
          <Link href="/calendar">
            <Card className="bg-slate-800 border-slate-700 hover:border-red-600 transition-colors cursor-pointer">
              <CardHeader>
                <Calendar className="w-8 h-8 text-red-600 mb-2" />
                <CardTitle className="text-white">レースカレンダー</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">全24レースの日程、予選、フリー走行を日本時間で表示</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/standings">
            <Card className="bg-slate-800 border-slate-700 hover:border-red-600 transition-colors cursor-pointer">
              <CardHeader>
                <Trophy className="w-8 h-8 text-red-600 mb-2" />
                <CardTitle className="text-white">スタンディングス</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">ドライバーとコンストラクターの現在の順位とポイント</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/statistics">
            <Card className="bg-slate-800 border-slate-700 hover:border-red-600 transition-colors cursor-pointer">
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-red-600 mb-2" />
                <CardTitle className="text-white">統計情報</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">ポイント推移グラフと分析データ</p>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* クイック統計 */}
        <section className="bg-slate-800 border border-slate-700 rounded-lg p-4 md:p-8 mb-8 md:mb-16">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6">2025シーズン概要</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div>
              <p className="text-slate-400 text-xs md:text-sm">総レース数</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{mainRaces.length}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs md:text-sm">スプリント</p>
              <p className="text-2xl md:text-3xl font-bold text-white">{sprintRaces.length}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs md:text-sm">チーム数</p>
              <p className="text-2xl md:text-3xl font-bold text-white">10</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs md:text-sm">ドライバー数</p>
              <p className="text-2xl md:text-3xl font-bold text-white">20</p>
            </div>
          </div>
        </section>

        {/* 優勝までの必要ポイント */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
