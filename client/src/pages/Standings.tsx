import { useState } from 'react';
import { Link } from 'wouter';
import { Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import f1Data from '../f1_data.json';

interface Driver {
  position: number;
  name: string;
  code: string;
  nationality?: string;
  team: string;
  points: number;
}

interface Constructor {
  position: number;
  name: string;
  points: number;
}

interface F1Data {
  races_by_year?: Record<string, any[]>;
  current_season?: number;
  races?: any[];
  drivers_standings: Driver[];
  constructors_standings: Constructor[];
  sprint_points_2024?: Record<string, number>;
}

// レース結果から順位表を計算
function calculateStandings(races: any[], year: number, sprintPoints?: Record<string, number>) {
  const driverPoints: Record<string, { name: string; code: string; team: string; points: number }> = {};
  const constructorPoints: Record<string, { name: string; points: number }> = {};

  // 結果があるレースだけを対象
  const racesWithResults = races.filter(race => race.results && race.results.length > 0);

  racesWithResults.forEach(race => {
    race.results.forEach((result: any) => {
      const { driver, driver_code, team, points } = result;

      // ドライバーポイント
      if (!driverPoints[driver_code]) {
        driverPoints[driver_code] = { name: driver, code: driver_code, team, points: 0 };
      }
      driverPoints[driver_code].points += points;

      // コンストラクターポイント
      if (!constructorPoints[team]) {
        constructorPoints[team] = { name: team, points: 0 };
      }
      constructorPoints[team].points += points;
    });
  });

  // 2024年の場合はスプリントポイントを追加
  if (year === 2024 && sprintPoints) {
    Object.entries(sprintPoints).forEach(([code, points]) => {
      if (driverPoints[code]) {
        driverPoints[code].points += points;
      }
    });
  }

  // ランキング順にソート
  const driversStandings = Object.values(driverPoints)
    .sort((a, b) => b.points - a.points)
    .map((driver, index) => ({
      position: index + 1,
      ...driver
    }));

  const constructorsStandings = Object.values(constructorPoints)
    .sort((a, b) => b.points - a.points)
    .map((constructor, index) => ({
      position: index + 1,
      ...constructor
    }));

  return { driversStandings, constructorsStandings };
}

export default function Standings() {
  const data = f1Data as F1Data;

  // 利用可能な年度を取得
  const availableYears = data.races_by_year
    ? Object.keys(data.races_by_year).map(Number).sort((a, b) => b - a)
    : [data.current_season || 2025];

  const [selectedYear, setSelectedYear] = useState(availableYears[0]);
  const [view, setView] = useState<'drivers' | 'constructors'>('drivers');

  // 選択された年度のレースデータを取得
  const races = (data.races_by_year?.[selectedYear] || data.races || []) as any[];

  // 現在シーズン(2025)かどうかを判定
  const isCurrentSeason = selectedYear === (data.current_season || 2025);

  // 年度別のドライバーとコンストラクター順位を計算
  const { driversStandings: calculatedDrivers, constructorsStandings: calculatedConstructors } = calculateStandings(
    races,
    selectedYear,
    data.sprint_points_2024
  );

  // 現在シーズンはf1_data.jsonのデータを使用、過去シーズンは計算結果を使用
  const drivers = isCurrentSeason ? data.drivers_standings : calculatedDrivers;
  const constructors = isCurrentSeason ? data.constructors_standings : calculatedConstructors;

  const maxPoints = 600;

  const getTeamColor = (team: string): string => {
    const colors: Record<string, string> = {
      'McLaren': 'bg-orange-600',
      'Red Bull Racing': 'bg-blue-600',
      'Red Bull': 'bg-blue-600',
      'Ferrari': 'bg-red-600',
      'Mercedes': 'bg-cyan-600',
      'Williams': 'bg-blue-400',
      'Kick Sauber': 'bg-green-600',
      'Sauber': 'bg-green-600',
      'Racing Bulls': 'bg-indigo-600',
      'RB F1 Team': 'bg-indigo-600',
      'Aston Martin': 'bg-green-700',
      'Haas F1 Team': 'bg-red-700',
      'Haas': 'bg-red-700',
      'Alpine F1 Team': 'bg-pink-600',
      'Alpine': 'bg-pink-600',
      'Renault': 'bg-yellow-500',
      'Racing Point': 'bg-pink-500',
      'AlphaTauri': 'bg-indigo-600',
      'Alfa Romeo': 'bg-red-800',
    };
    return colors[team] || 'bg-slate-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-0">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white px-2">
                戻る
              </Button>
            </Link>
            <h1 className="text-lg md:text-2xl font-bold text-white">順位</h1>
          </div>
          <div className="flex items-center gap-1 md:gap-2 overflow-x-auto pb-1 md:pb-0 -mx-4 px-4">
            {availableYears.map(year => (
              <Button
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedYear(year)}
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
        <div className="flex flex-col sm:flex-row gap-2 md:gap-4 mb-4 md:mb-8">
          <Button
            onClick={() => setView('drivers')}
            size="sm"
            className={`flex-1 text-xs md:text-sm ${
              view === 'drivers'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Users className="mr-1 md:mr-2 w-3 h-3 md:w-4 md:h-4" />
            ドライバーズ
          </Button>
          <Button
            onClick={() => setView('constructors')}
            size="sm"
            className={`flex-1 text-xs md:text-sm ${
              view === 'constructors'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            <Trophy className="mr-1 md:mr-2 w-3 h-3 md:w-4 md:h-4" />
            コンストラクターズ
          </Button>
        </div>

        {view === 'drivers' ? (
          <div className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">ドライバーズチャンピオンシップ順位表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {drivers.map((driver: any) => {
                    const pointsNeeded = Math.max(0, maxPoints - driver.points);
                    return (
                    <div
                      key={driver.position}
                      className="flex items-center justify-between bg-slate-700 rounded-lg p-3 md:p-4 hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-2 md:gap-4 flex-1">
                        <div className="text-center w-8 md:w-12">
                          <span className="text-xl md:text-2xl font-bold text-white">{driver.position}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-base md:text-lg truncate">{driver.name}</p>
                          <p className="text-slate-400 text-xs md:text-sm truncate">{driver.team}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl md:text-2xl font-bold text-white">{driver.points}</p>
                        <p className="text-slate-400 text-xs">pts</p>
                        <div className="mt-1 md:mt-2 bg-slate-800 rounded px-1 md:px-2 py-1">
                          <p className="text-green-400 text-xs font-semibold">
                            +{pointsNeeded}
                          </p>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">コンストラクターズチャンピオンシップ順位表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {constructors.map((constructor: any) => {
                    const pointsNeeded = Math.max(0, maxPoints - constructor.points);
                    return (
                    <div
                      key={constructor.position}
                      className="flex items-center justify-between bg-slate-700 rounded-lg p-3 md:p-4 hover:bg-slate-600 transition-colors"
                    >
                      <div className="flex items-center gap-2 md:gap-4 flex-1">
                        <div className="text-center w-8 md:w-12">
                          <span className="text-xl md:text-2xl font-bold text-white">{constructor.position}</span>
                        </div>
                        <div className={`${getTeamColor(constructor.name)} rounded-full w-10 h-10 md:w-12 md:h-12 flex items-center justify-center flex-shrink-0`}>
                          <Trophy className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm md:text-base truncate">{constructor.name}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl md:text-2xl font-bold text-white">{constructor.points}</p>
                        <p className="text-slate-400 text-xs">pts</p>
                        <div className="mt-1 md:mt-2 bg-slate-800 rounded px-1 md:px-2 py-1">
                          <p className="text-green-400 text-xs font-semibold">
                            +{pointsNeeded}
                          </p>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
