#!/usr/bin/env node
/**
 * Parse yearly CSV files (races, sessions, results) and convert to JSON format
 *
 * Usage: pnpm tsx server/scripts/parseYearlyCSV.ts 2020
 */

import * as fs from 'fs';
import * as path from 'path';

interface Race {
  round: number;
  race_name: string;
  race_name_ja: string;
  circuit: string;
  location: string;
  date_start: string;
  date_end: string;
}

interface Session {
  round: number;
  session_name: string;
  session_date: string;
  time_utc: string;
  time_jst: string;
}

interface Result {
  round: number;
  position: number;
  driver_code: string;
  driver_name: string;
  team: string;
  points: number;
  grid: number;
  laps: string;
  time: string;
  status: string;
}

interface RaceData {
  round: number;
  name: string;
  name_ja: string;
  circuit: string;
  location: string;
  date_start: string;
  date_end: string;
  sessions: Array<{
    name: string;
    date: string;
    time_utc: string;
    time_jst: string;
  }>;
  results: Array<{
    position: number;
    driver: string;
    driver_code: string;
    team: string;
    points: number;
    grid: number;
    laps: string;
    time: string;
    status: string;
  }>;
}

function parseCSV<T>(filepath: string): T[] {
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  File not found: ${filepath}`);
    return [];
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.trim().split('\n');

  if (lines.length <= 1) {
    console.log(`⚠️  No data in file: ${filepath}`);
    return [];
  }

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj: any = {};

    headers.forEach((header, i) => {
      let value: any = values[i] || '';

      // 数値型に変換
      if (header === 'round' || header === 'position' || header === 'points' || header === 'grid') {
        value = parseInt(value) || 0;
      }

      obj[header] = value;
    });

    return obj as T;
  });
}

// Proper CSV parsing that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

async function parseYear(year: number) {
  console.log(`\nParsing F1 data for ${year}...`);

  const racesFile = path.join(process.cwd(), `F1-${year}-races.csv`);
  const sessionsFile = path.join(process.cwd(), `F1-${year}-sessions.csv`);
  const resultsFile = path.join(process.cwd(), `F1-${year}-results.csv`);

  // CSVファイルを読み込み
  const races = parseCSV<Race>(racesFile);
  const sessions = parseCSV<Session>(sessionsFile);
  const results = parseCSV<Result>(resultsFile);

  console.log(`  📋 Races: ${races.length}`);
  console.log(`  🏁 Sessions: ${sessions.length}`);
  console.log(`  🏆 Results: ${results.length}`);

  // データを統合
  const raceData: RaceData[] = races.map(race => {
    // このラウンドのセッションを取得
    const raceSessions = sessions
      .filter(s => s.round === race.round)
      .map(s => ({
        name: s.session_name,
        date: s.session_date,
        time_utc: s.time_utc,
        time_jst: s.time_jst
      }));

    // このラウンドの結果を取得
    const raceResults = results
      .filter(r => r.round === race.round)
      .sort((a, b) => a.position - b.position)
      .map(r => ({
        position: r.position,
        driver: r.driver_name,
        driver_code: r.driver_code,
        team: r.team,
        points: r.points,
        grid: r.grid,
        laps: r.laps,
        time: r.time,
        status: r.status
      }));

    return {
      round: race.round,
      name: race.race_name,
      name_ja: race.race_name_ja,
      circuit: race.circuit,
      location: race.location,
      date_start: race.date_start,
      date_end: race.date_end,
      sessions: raceSessions,
      results: raceResults
    };
  });

  // 順位表を計算
  const driverPoints: Record<string, { name: string; code: string; team: string; points: number }> = {};
  const constructorPoints: Record<string, { name: string; points: number }> = {};

  raceData.forEach(race => {
    race.results.forEach(result => {
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

  console.log(`\n📊 Final Standings:`);
  if (driversStandings.length > 0) {
    console.log(`  🏆 Champion: ${driversStandings[0].name} (${driversStandings[0].points} pts)`);
    console.log(`  🏁 Constructor Champion: ${constructorsStandings[0].name} (${constructorsStandings[0].points} pts)`);
  }

  // f1_data.jsonに統合
  const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
  const existingData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  if (!existingData.races_by_year) {
    existingData.races_by_year = {};
  }

  existingData.races_by_year[year] = raceData;

  fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));

  console.log(`\n✅ Successfully added ${year} data to client/src/f1_data.json`);
}

async function main() {
  const year = parseInt(process.argv[2]);

  if (!year || isNaN(year)) {
    console.error('Usage: pnpm tsx server/scripts/parseYearlyCSV.ts <year>');
    console.error('Example: pnpm tsx server/scripts/parseYearlyCSV.ts 2020');
    process.exit(1);
  }

  await parseYear(year);
}

main().catch(console.error);
