import { useState } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import f1Data from '../f1_data.json';

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
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [races] = useState<Race[]>(f1Data.races);
  const [currentMonth, setCurrentMonth] = useState(0);

  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  const racesByMonth = races.reduce((acc, race) => {
    const month = new Date(race.date_start).getMonth();
    if (!acc[month]) acc[month] = [];
    acc[month].push(race);
    return acc;
  }, {} as Record<number, Race[]>);

  const monthsWithRaces = Object.keys(racesByMonth).map(Number).sort((a, b) => a - b);
  const currentMonthIndex = monthsWithRaces[currentMonth] || 0;
  const racesInMonth = racesByMonth[currentMonthIndex] || [];

  const handlePrevMonth = () => {
    setCurrentMonth(Math.max(0, currentMonth - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(Math.min(monthsWithRaces.length - 1, currentMonth + 1));
  };

  const selectedRaceData = races.find(r => r.round === selectedRound);

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
            <h1 className="text-2xl font-bold text-white">2025 レースカレンダー</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevMonth}
                disabled={currentMonth === 0}
                className="border-slate-600 text-white hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-2xl font-bold text-white">
                2025年 {months[currentMonthIndex]}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                disabled={currentMonth === monthsWithRaces.length - 1}
                className="border-slate-600 text-white hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {racesInMonth.map((race) => {
                const isSelected = selectedRound === race.round;
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
                            <span className="text-slate-400 text-sm">{formatDate(race.date_start)}</span>
                          </div>
                          <CardTitle className="text-white text-lg">{race.name_ja || race.name}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-4 h-4 text-red-600" />
                        <span>{race.circuit}, {race.location}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <div>
            {selectedRaceData ? (
              <Card className="bg-slate-800 border-slate-700 sticky top-24">
                <CardHeader>
                  <Badge className="bg-red-600 w-fit mb-2">第{selectedRaceData.round}戦</Badge>
                  <CardTitle className="text-white">{selectedRaceData.name_ja || selectedRaceData.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-slate-400 text-sm font-semibold mb-2">サーキット</h3>
                    <p className="text-white font-medium">{selectedRaceData.circuit}</p>
                    <p className="text-slate-400 text-sm">{selectedRaceData.location}</p>
                  </div>

                  {selectedRaceData.sessions && selectedRaceData.sessions.length > 0 && (
                    <div>
                      <h3 className="text-slate-400 text-sm font-semibold mb-3">セッション</h3>
                      <div className="space-y-3">
                        {selectedRaceData.sessions.map((session, idx) => (
                          <div key={idx} className="bg-slate-700 rounded p-4 border-l-4 border-red-600">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-white font-semibold text-sm">{sessionNameJa[session.name] || session.name}</p>
                              <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">{formatDate(session.date)}</span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-semibold">{session.time_jst}</span>
                                <span className="text-slate-400 text-xs">(日本時間)</span>
                              </div>
                              <p className="text-xs text-slate-500 ml-6">{session.time_utc} (UTC)</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-slate-400 text-sm font-semibold mb-2">開催日程</h3>
                    <p className="text-white text-sm">
                      {formatDate(selectedRaceData.date_start)} ～ {formatDate(selectedRaceData.date_end)}
                    </p>
                  </div>
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
