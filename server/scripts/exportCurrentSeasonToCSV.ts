#!/usr/bin/env node
/**
 * Export current season data to CSV format
 */

import * as fs from 'fs';
import * as path from 'path';

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
  results?: RaceResult[];
}

interface F1Data {
  season?: number;
  current_season?: number;
  races?: Race[];
  races_by_year?: Record<string, Race[]>;
}

async function main() {
  // f1_data.jsonを読み込む
  const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
  const data: F1Data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const currentSeason = data.current_season || data.season || 2025;
  const races = data.races_by_year?.[currentSeason] || data.races || [];

  console.log(`Exporting ${currentSeason} season data to CSV...`);
  console.log(`Total races: ${races.length}`);

  // CSVヘッダーを作成
  const csvLines: string[] = [];

  // レース一覧のヘッダー
  csvLines.push('ラウンド,レース名,空白列,レース情報,日付,サーキット名');

  // レース基本情報を追加
  races.forEach(race => {
    const raceName = race.name_ja || race.name;
    const location = race.location || '';
    const dateStr = race.date_end.replace(/-/g, '/'); // YYYY-MM-DD → YYYY/MM/DD
    csvLines.push(`${race.round},${raceName},,Rd.${race.round},${dateStr},${race.circuit}`);
  });

  // 空行
  csvLines.push('');

  // 各レースの結果を追加
  races.forEach(race => {
    if (!race.results || race.results.length === 0) return;

    // レースヘッダー
    csvLines.push('');
    const raceName = race.name_ja || race.name;
    const dateStr = race.date_end.replace(/-/g, '/');
    csvLines.push(`,,,Rd.${race.round},${dateStr},${race.circuit}`);

    // 結果ヘッダー
    csvLines.push(',,,順位,No.,ドライバー名,チーム名,周回数,タイム,グリッド,ポイント');

    // 結果データ
    race.results.forEach(result => {
      const position = result.status === 'Retired' ? 'Ret' : result.position;
      const driverNumber = ''; // ドライバー番号がない場合は空
      const driver = result.driver;
      const team = result.team;
      const laps = ''; // 周回数データがない場合は空
      const time = result.time || '';
      const grid = ''; // グリッド位置データがない場合は空
      const points = result.points;

      csvLines.push(`,,,${position},${driverNumber},${driver},${team},${laps},${time},${grid},${points}`);
    });
  });

  // CSVファイルに書き込む
  const csvPath = path.join(process.cwd(), `F1-Data-${currentSeason}.csv`);
  fs.writeFileSync(csvPath, csvLines.join('\n'), 'utf-8');

  console.log(`\n✅ Successfully exported to ${csvPath}`);
  console.log(`\nFile contains:`);
  console.log(`  - ${races.length} races`);
  const racesWithResults = races.filter(r => r.results && r.results.length > 0);
  console.log(`  - ${racesWithResults.length} races with results`);
}

main();
