import { useState } from 'react';
import { Link } from 'wouter';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import f1Data from '../f1_data.json';

const COLORS = ['#dc2626', '#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];

interface F1Data {
  races_by_year?: Record<string, any[]>;
  current_season?: number;
  races?: any[];
  drivers_standings: any[];
  constructors_standings: any[];
}

// レース結果からポイント推移を計算
function calculatePointsProgression(races: any[]) {
  const driverPoints: Record<string, number[]> = {};
  const driverNames: Record<string, string> = {};
  const roundLabels: string[] = [];

  // 結果があるレースだけを対象
  const racesWithResults = races.filter(race => race.results && race.results.length > 0);

  racesWithResults.forEach((race, index) => {
    roundLabels.push(`R${race.round}`);

    race.results.forEach((result: any) => {
      const code = result.driver_code;
      const name = result.driver;

      if (!driverPoints[code]) {
        driverPoints[code] = new Array(index).fill(0);
        driverNames[code] = name;
      }

      // 前のレースまでの累積ポイント + 今回のポイント
      const previousPoints = index > 0 ? driverPoints[code][index - 1] : 0;
      driverPoints[code].push(previousPoints + result.points);
    });

    // 今回のレースに出走しなかったドライバーは前回と同じポイント
    Object.keys(driverPoints).forEach(code => {
      if (driverPoints[code].length <= index) {
        const lastPoints = driverPoints[code][driverPoints[code].length - 1] || 0;
        driverPoints[code].push(lastPoints);
      }
    });
  });

  // 最終ポイントでソートしてトップ10を取得
  const sortedDrivers = Object.entries(driverPoints)
    .map(([code, points]) => ({
      code,
      name: driverNames[code],
      finalPoints: points[points.length - 1],
      progression: points
    }))
    .sort((a, b) => b.finalPoints - a.finalPoints)
    .slice(0, 10);

  // グラフ用のデータを作成
  const chartData = roundLabels.map((label, index) => {
    const dataPoint: any = { round: label };
    sortedDrivers.forEach(driver => {
      dataPoint[driver.code] = driver.progression[index] || 0;
    });
    return dataPoint;
  });

  return { chartData, drivers: sortedDrivers };
}

export default function Statistics() {
  const data = f1Data as F1Data;
  const drivers = data.drivers_standings;
  const constructors = data.constructors_standings;

  // 利用可能な年度を取得
  const availableYears = data.races_by_year
    ? Object.keys(data.races_by_year).map(Number).sort((a, b) => b - a)
    : [data.current_season || 2025];

  const [selectedYear, setSelectedYear] = useState(availableYears[0]);

  // 選択された年度のレースデータを取得
  const races = (data.races_by_year?.[selectedYear] || data.races || []) as any[];

  // ポイント推移を計算
  const { chartData: pointsProgressionData, drivers: topDrivers } = calculatePointsProgression(races);

  const driverChartData = drivers.slice(0, 10).map((d: any) => ({
    name: d.code,
    points: d.points
  }));

  const constructorChartData = constructors.slice(0, 10).map((c: any) => ({
    name: c.name,
    points: c.points
  }));

  const pointsDistribution = [
    { name: 'トップ3', value: drivers.slice(0, 3).reduce((sum: number, d: any) => sum + d.points, 0) },
    { name: 'トップ4-10', value: drivers.slice(3, 10).reduce((sum: number, d: any) => sum + d.points, 0) },
    { name: 'その他', value: drivers.slice(10).reduce((sum: number, d: any) => sum + d.points, 0) }
  ];

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
              <h1 className="text-lg md:text-2xl font-bold text-white">{selectedYear} 統計</h1>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2 overflow-x-auto pb-1 md:pb-0">
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
        {/* ポイント推移グラフ */}
        <Card className="bg-slate-800 border-slate-700 mb-4 md:mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base md:text-lg">トップ10ドライバーのポイント推移</CardTitle>
            <p className="text-slate-400 text-xs md:text-sm">各レースごとの累積ポイント推移を表示</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} className="md:!h-[400px]">
              <LineChart data={pointsProgressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="round" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend />
                {topDrivers.map((driver, index) => (
                  <Line
                    key={driver.code}
                    type="monotone"
                    dataKey={driver.code}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={`${driver.code} (${driver.finalPoints}pts)`}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-8">
          {/* Drivers Points Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base md:text-lg">トップ10ドライバーのポイント</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250} className="md:!h-[300px]">
                <BarChart data={driverChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="points" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Constructors Points Chart */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base md:text-lg">トップ10コンストラクターのポイント</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250} className="md:!h-[300px]">
                <BarChart data={constructorChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="name" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Bar dataKey="points" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Points Distribution */}
        <Card className="bg-slate-800 border-slate-700 mb-4 md:mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base md:text-lg">ドライバーグループ別ポイント分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250} className="md:!h-[300px]">
              <PieChart>
                <Pie
                  data={pointsDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pointsDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 md:pt-6 pb-4">
              <div className="text-center">
                <p className="text-slate-400 text-xs md:text-sm mb-1 md:mb-2">リーダー<br className="md:hidden" />（ドライバー）</p>
                <p className="text-base md:text-2xl font-bold text-white truncate px-1">{drivers[0].name}</p>
                <p className="text-red-600 font-semibold text-sm md:text-base">{drivers[0].points} pts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 md:pt-6 pb-4">
              <div className="text-center">
                <p className="text-slate-400 text-xs md:text-sm mb-1 md:mb-2">リーダー<br className="md:hidden" />（チーム）</p>
                <p className="text-base md:text-2xl font-bold text-white truncate px-1">{constructors[0].name}</p>
                <p className="text-blue-600 font-semibold text-sm md:text-base">{constructors[0].points} pts</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 md:pt-6 pb-4">
              <div className="text-center">
                <p className="text-slate-400 text-xs md:text-sm mb-1 md:mb-2">総レース数</p>
                <p className="text-xl md:text-2xl font-bold text-white">{races.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-4 md:pt-6 pb-4">
              <div className="text-center">
                <p className="text-slate-400 text-xs md:text-sm mb-1 md:mb-2">総ドライバー数</p>
                <p className="text-xl md:text-2xl font-bold text-white">{drivers.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
