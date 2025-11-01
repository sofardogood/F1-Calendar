import { useState } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight, Clock, MapPin, Trophy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import f1Data from '../f1_data.json';

interface RaceResult {
  position: number;
  driver: string;
  driver_code: string;
  team: string;
  points: number;
  time?: string;
  status: string;
}

interface Race {
  round: number;
  name: string;
  name_ja?: string;
  circuit: string;
  location: string;
  date_start: string;
  date_end: string;
  sessions?: Array<{
    name: string;
    date: string;
    time_utc: string;
    time_jst: string;
  }>;
  results?: RaceResult[];
}

interface F1Data {
  races_by_year?: Record<string, Race[]>;
  current_season?: number;
  races?: Race[];
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', year: 'numeric' });
};

const sessionNameJa: Record<string, string> = {
  'Free Practice 1': 'フリー走行1',
  'Free Practice 2': 'フリー走行2',
  'Free Practice 3': 'フリー走行3',
  'Qualifying': '予選',
  'Sprint Qualifying': 'スプリント予選',
  'Sprint': 'スプリント',
  'Race': 'レース'
};

export default function Calendar() {
  const data = f1Data as F1Data;

  // 利用可能な年度を取得
  const availableYears = data.races_by_year
    ? Object.keys(data.races_by_year).map(Number).sort((a, b) => b - a) // 降順にソート
    : [data.current_season || 2025];

  const [selectedYear, setSelectedYear] = useState(availableYears[0]);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(0);

  // 選択された年度のレースデータを取得
  const races = (data.races_by_year?.[selectedYear] || data.races || []) as Race[];

  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  // 過去年度（結果のみ）かどうかを判定
  const isHistoricalYear = races.length > 0 && races[0].date_start === `${selectedYear}-01-01`;

  // 過去年度は月別表示をせず、全レース表示
  let racesInMonth: Race[];
  let monthsWithRaces: number[];
  let currentMonthIndex: number;

  if (isHistoricalYear) {
    racesInMonth = races;
    monthsWithRaces = [0];
    currentMonthIndex = 0;
  } else {
    const racesByMonth = races.reduce((acc, race) => {
      const month = new Date(race.date_start).getMonth();
      if (!acc[month]) acc[month] = [];
      acc[month].push(race);
      return acc;
    }, {} as Record<number, Race[]>);

    monthsWithRaces = Object.keys(racesByMonth).map(Number).sort((a, b) => a - b);
    currentMonthIndex = monthsWithRaces[currentMonth] || 0;
    racesInMonth = racesByMonth[currentMonthIndex] || [];
  }

  const handlePrevMonth = () => {
    setCurrentMonth(Math.max(0, currentMonth - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(Math.min(monthsWithRaces.length - 1, currentMonth + 1));
  };

  const selectedRaceData = races.find(r => r.round === selectedRound);

  // レースが過去かどうかをチェック
  const isRacePast = (race: Race) => {
    const raceDate = new Date(race.date_end);
    const now = new Date();
    return raceDate < now;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white px-2">
                  戻る
                </Button>
              </Link>
              <h1 className="text-lg md:text-2xl font-bold text-white">{selectedYear} カレンダー</h1>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 overflow-x-auto pb-1 md:pb-0">
            {availableYears.map(year => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setSelectedYear(year);
                  setCurrentMonth(0);
                  setSelectedRound(null);
                }}
                className={`flex-shrink-0 text-xs md:text-sm px-2 md:px-3 ${selectedYear === year
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "border-slate-600 text-white hover:bg-slate-800"
                }`}
              >
                {year}年
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          <div className="lg:col-span-2">
            {!isHistoricalYear && (
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevMonth}
                  disabled={currentMonth === 0}
                  className="border-slate-600 text-white hover:bg-slate-800 px-2 md:px-3"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-lg md:text-2xl font-bold text-white">
                  {selectedYear}年 {months[currentMonthIndex]}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextMonth}
                  disabled={currentMonth === monthsWithRaces.length - 1}
                  className="border-slate-600 text-white hover:bg-slate-800 px-2 md:px-3"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
            {isHistoricalYear && (
              <div className="mb-4 md:mb-6">
                <h2 className="text-lg md:text-2xl font-bold text-white text-center">
                  {selectedYear}年 全レース結果
                </h2>
              </div>
            )}

            <div className="space-y-4">
              {racesInMonth.map((race) => {
                const isSelected = selectedRound === race.round;
                const isPast = isRacePast(race);
                const hasResults = race.results && race.results.length > 0;
                return (
                  <Card
                    key={race.round}
                    className={`bg-slate-800 border-slate-700 cursor-pointer transition-all hover:border-red-600 ${
                      isSelected ? 'border-red-600 ring-2 ring-red-600' : ''
                    }`}
                    onClick={() => setSelectedRound(race.round)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-red-600">第{race.round}戦</Badge>
                            {hasResults && (
                              <Badge className="bg-green-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                終了
                              </Badge>
                            )}
                            <span className="text-slate-400 text-sm">
                              {race.date_start === race.date_end
                                ? formatDate(race.date_start)
                                : `${formatDate(race.date_start)} ～ ${formatDate(race.date_end)}`
                              }
                            </span>
                          </div>
                          <CardTitle className="text-white text-lg">{race.name_ja || race.name}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <span className="text-sm">{race.circuit}, {race.location}</span>
                      </div>

                      {hasResults && (
                        <div className="pt-2 border-t border-slate-700">
                          <div className="space-y-1 max-h-96 overflow-y-auto">
                            {race.results.map((result, idx) => (
                              <div key={idx} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold w-5 text-right ${
                                    idx === 0 ? 'text-yellow-400' :
                                    idx === 1 ? 'text-slate-300' :
                                    idx === 2 ? 'text-orange-400' :
                                    'text-slate-500'
                                  }`}>
                                    {result.position}
                                  </span>
                                  <span className="text-white font-medium">{result.driver_code}</span>
                                </div>
                                <span className="text-slate-400 text-xs truncate ml-2">{result.team}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            {selectedRaceData ? (
              <Card className="bg-slate-800 border-slate-700 lg:sticky lg:top-24">
                <CardHeader>
                  <Badge className="bg-red-600 w-fit mb-2 text-xs md:text-sm">第{selectedRaceData.round}戦</Badge>
                  <CardTitle className="text-white text-lg md:text-xl">{selectedRaceData.name_ja || selectedRaceData.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-slate-400 text-sm font-semibold mb-2">サーキット</h3>
                    <p className="text-white font-medium">{selectedRaceData.circuit}</p>
                    <p className="text-slate-400 text-sm">{selectedRaceData.location}</p>
                  </div>

                  {selectedRaceData.sessions && selectedRaceData.sessions.length > 0 && (
                    <div>
                      <h3 className="text-slate-400 text-sm font-semibold mb-3">セッションスケジュール</h3>
                      <div className="space-y-4">
                        {(() => {
                          // 日付ごとにセッションをグループ化
                          const sessionsByDate = selectedRaceData.sessions!.reduce((acc, session) => {
                            if (!acc[session.date]) acc[session.date] = [];
                            acc[session.date].push(session);
                            return acc;
                          }, {} as Record<string, typeof selectedRaceData.sessions>);

                          return Object.entries(sessionsByDate).map(([date, sessions]) => (
                            <div key={date} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="h-px bg-slate-600 flex-1"></div>
                                <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-1 rounded">
                                  {formatDate(date)}
                                </span>
                                <div className="h-px bg-slate-600 flex-1"></div>
                              </div>
                              {sessions!.map((session, idx) => (
                                <div key={idx} className="bg-slate-700 rounded p-3 border-l-4 border-red-600">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-white font-semibold text-sm">{sessionNameJa[session.name] || session.name}</p>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Clock className="w-4 h-4 text-green-400" />
                                      <span className="text-green-400 font-semibold">{session.time_jst}</span>
                                      <span className="text-slate-400 text-xs">(JST)</span>
                                      <span className="text-slate-500 text-xs">/ {session.time_utc} (UTC)</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-slate-400 text-sm font-semibold mb-2">開催日程</h3>
                    <p className="text-white text-sm">
                      {formatDate(selectedRaceData.date_start)} ～ {formatDate(selectedRaceData.date_end)}
                    </p>
                  </div>

                  {selectedRaceData.results && selectedRaceData.results.length > 0 && (
                    <div>
                      <h3 className="text-slate-400 text-sm font-semibold mb-3">レース結果</h3>
                      <div className="space-y-2">
                        {selectedRaceData.results.slice(0, 10).map((result, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-3 rounded ${
                              idx === 0 ? 'bg-gradient-to-r from-yellow-900/50 to-slate-700 border border-yellow-600' :
                              idx === 1 ? 'bg-gradient-to-r from-slate-700 to-slate-700 border border-slate-500' :
                              idx === 2 ? 'bg-gradient-to-r from-orange-900/30 to-slate-700 border border-orange-700' :
                              'bg-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <span className={`text-lg font-bold w-6 ${
                                idx === 0 ? 'text-yellow-400' :
                                idx === 1 ? 'text-slate-300' :
                                idx === 2 ? 'text-orange-400' :
                                'text-slate-400'
                              }`}>
                                {result.position}
                              </span>
                              <div className="flex-1">
                                <p className="text-white font-semibold text-sm">{result.driver_code}</p>
                                <p className="text-slate-400 text-xs">{result.team}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-bold text-sm">{result.points}pt</p>
                              {result.time && (
                                <p className="text-slate-400 text-xs">{result.time}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 text-center text-slate-400">
                  <p>レースを選択して詳細を表示</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
