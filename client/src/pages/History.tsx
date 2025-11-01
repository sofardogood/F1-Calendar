import { useState } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';

export default function History() {
  const [selectedSeason, setSelectedSeason] = useState<number>(2024);
  const [view, setView] = useState<'seasons' | 'standings'>('seasons');

  // Fetch available seasons (2005-2024)
  const seasons = Array.from({ length: 20 }, (_, i) => 2024 - i);

  // Fetch season races
  const { data: races, isLoading: racesLoading } = trpc.f1.getSeasonRaces.useQuery(
    { season: selectedSeason },
    { enabled: view === 'seasons' }
  );

  // Fetch driver standings
  const { data: driverStandings, isLoading: driverLoading } = trpc.f1.getDriverStandings.useQuery(
    { season: selectedSeason },
    { enabled: view === 'standings' }
  );

  // Fetch constructor standings
  const { data: constructorStandings, isLoading: constructorLoading } = trpc.f1.getConstructorStandings.useQuery(
    { season: selectedSeason },
    { enabled: view === 'standings' }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                戻る
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">F1 歴史データ</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* シーズン選択 */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 sticky top-24">
              <CardHeader>
                <CardTitle className="text-white text-lg">シーズン選択</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {seasons.map((season) => (
                    <Button
                      key={season}
                      variant={selectedSeason === season ? 'default' : 'outline'}
                      className={`w-full justify-start ${
                        selectedSeason === season
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'border-slate-600 text-slate-300 hover:bg-slate-700'
                      }`}
                      onClick={() => setSelectedSeason(season)}
                    >
                      {season}年シーズン
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-3">
            {/* ビュー切り替え */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={view === 'seasons' ? 'default' : 'outline'}
                className={view === 'seasons' ? 'bg-red-600 hover:bg-red-700' : 'border-slate-600 text-slate-300'}
                onClick={() => setView('seasons')}
              >
                レース日程
              </Button>
              <Button
                variant={view === 'standings' ? 'default' : 'outline'}
                className={view === 'standings' ? 'bg-red-600 hover:bg-red-700' : 'border-slate-600 text-slate-300'}
                onClick={() => setView('standings')}
              >
                <Trophy className="w-4 h-4 mr-2" />
                スタンディングス
              </Button>
            </div>

            {/* レース日程ビュー */}
            {view === 'seasons' && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white mb-4">{selectedSeason}年 F1シーズン</h2>
                {racesLoading ? (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6 text-center text-slate-400">
                      読み込み中...
                    </CardContent>
                  </Card>
                ) : races && races.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {races.map((race: any) => (
                      <Card key={race.round} className="bg-slate-800 border-slate-700 hover:border-red-600 transition-colors">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <Badge className="bg-red-600 mb-2">第{race.round}戦</Badge>
                              <CardTitle className="text-white text-lg">{race.raceName}</CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-sm">
                            <p className="text-slate-400">サーキット</p>
                            <p className="text-white font-medium">{race.Circuit?.circuitName}</p>
                          </div>
                          <div className="text-sm">
                            <p className="text-slate-400">開催日</p>
                            <p className="text-white font-medium">{race.date}</p>
                          </div>
                          {race.Results && (
                            <div className="text-sm">
                              <p className="text-slate-400">優勝者</p>
                              <p className="text-white font-medium">
                                {race.Results[0]?.Driver?.givenName} {race.Results[0]?.Driver?.familyName}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6 text-center text-slate-400">
                      データがありません
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* スタンディングスビュー */}
            {view === 'standings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-white mb-4">{selectedSeason}年 最終スタンディングス</h2>

                {/* ドライバーズランキング */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">ドライバーズチャンピオンシップ</h3>
                  {driverLoading ? (
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6 text-center text-slate-400">
                        読み込み中...
                      </CardContent>
                    </Card>
                  ) : driverStandings && driverStandings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-slate-400">順位</th>
                            <th className="text-left py-3 px-4 text-slate-400">ドライバー</th>
                            <th className="text-left py-3 px-4 text-slate-400">チーム</th>
                            <th className="text-right py-3 px-4 text-slate-400">ポイント</th>
                          </tr>
                        </thead>
                        <tbody>
                          {driverStandings.map((standing: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50">
                              <td className="py-3 px-4 text-white font-bold">{standing.position}</td>
                              <td className="py-3 px-4 text-white">
                                {standing.Driver?.givenName} {standing.Driver?.familyName}
                              </td>
                              <td className="py-3 px-4 text-slate-300">{standing.Constructors?.[0]?.name}</td>
                              <td className="py-3 px-4 text-right text-red-600 font-bold">{standing.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6 text-center text-slate-400">
                        データがありません
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* コンストラクターズランキング */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">コンストラクターズチャンピオンシップ</h3>
                  {constructorLoading ? (
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6 text-center text-slate-400">
                        読み込み中...
                      </CardContent>
                    </Card>
                  ) : constructorStandings && constructorStandings.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-4 text-slate-400">順位</th>
                            <th className="text-left py-3 px-4 text-slate-400">チーム</th>
                            <th className="text-right py-3 px-4 text-slate-400">ポイント</th>
                          </tr>
                        </thead>
                        <tbody>
                          {constructorStandings.map((standing: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/50">
                              <td className="py-3 px-4 text-white font-bold">{standing.position}</td>
                              <td className="py-3 px-4 text-white">{standing.Constructor?.name}</td>
                              <td className="py-3 px-4 text-right text-blue-600 font-bold">{standing.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <Card className="bg-slate-800 border-slate-700">
                      <CardContent className="pt-6 text-center text-slate-400">
                        データがありません
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
