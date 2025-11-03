#!/usr/bin/env node
/**
 * Export a specific year's data from f1_data.json to 3 separate CSV files
 *
 * Usage: pnpm tsx server/scripts/exportYearToCSV.ts 2020
 */

import * as fs from 'fs';
import * as path from 'path';

interface F1Data {
  current_season?: number;
  races_by_year?: Record<string, any[]>;
  races?: any[];
}

async function exportYear(year: number) {
  console.log(`\nExporting F1 data for ${year} to CSV files...`);

  const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
  const data: F1Data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const races = data.races_by_year?.[year] || [];

  if (races.length === 0) {
    console.error(`❌ No data found for year ${year}`);
    process.exit(1);
  }

  console.log(`  Found ${races.length} races for ${year}`);

  // 1. レース情報CSVを作成
  const racesCSV: string[] = ['round,race_name,race_name_ja,circuit,location,date_start,date_end'];

  races.forEach((race: any) => {
    racesCSV.push([
      race.round,
      escapeCSV(race.name),
      escapeCSV(race.name_ja || race.name),
      escapeCSV(race.circuit),
      escapeCSV(race.location),
      race.date_start,
      race.date_end
    ].join(','));
  });

  const racesFile = path.join(process.cwd(), `F1-${year}-races.csv`);
  fs.writeFileSync(racesFile, racesCSV.join('\n'), 'utf-8');
  console.log(`  ✅ Created ${racesFile}`);

  // 2. セッション情報CSVを作成
  const sessionsCSV: string[] = ['round,session_name,session_date,time_utc,time_jst'];

  races.forEach((race: any) => {
    if (race.sessions && race.sessions.length > 0) {
      race.sessions.forEach((session: any) => {
        sessionsCSV.push([
          race.round,
          escapeCSV(session.name),
          session.date,
          session.time_utc,
          session.time_jst
        ].join(','));
      });
    }
  });

  const sessionsFile = path.join(process.cwd(), `F1-${year}-sessions.csv`);
  fs.writeFileSync(sessionsFile, sessionsCSV.join('\n'), 'utf-8');
  console.log(`  ✅ Created ${sessionsFile} (${sessionsCSV.length - 1} sessions)`);

  // 3. レース結果CSVを作成
  const resultsCSV: string[] = ['round,position,driver_code,driver_name,team,points,grid,laps,time,status'];

  let totalResults = 0;
  races.forEach((race: any) => {
    if (race.results && race.results.length > 0) {
      race.results.forEach((result: any) => {
        resultsCSV.push([
          race.round,
          result.position || 0,
          escapeCSV(result.driver_code || ''),
          escapeCSV(result.driver || ''),
          escapeCSV(result.team || ''),
          result.points || 0,
          result.grid || 0,
          escapeCSV(result.laps || ''),
          escapeCSV(result.time || ''),
          escapeCSV(result.status || 'Finished')
        ].join(','));
        totalResults++;
      });
    }
  });

  const resultsFile = path.join(process.cwd(), `F1-${year}-results.csv`);
  fs.writeFileSync(resultsFile, resultsCSV.join('\n'), 'utf-8');
  console.log(`  ✅ Created ${resultsFile} (${totalResults} results)`);

  console.log(`\n✅ Successfully exported ${year} data to CSV files`);
  console.log(`\nFiles created:`);
  console.log(`  - F1-${year}-races.csv`);
  console.log(`  - F1-${year}-sessions.csv`);
  console.log(`  - F1-${year}-results.csv`);
}

// CSVエスケープ処理
function escapeCSV(value: string): string {
  if (!value) return '';

  // カンマ、改行、ダブルクォートが含まれる場合はダブルクォートで囲む
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    // ダブルクォートを2つにエスケープ
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

async function main() {
  const year = parseInt(process.argv[2]);

  if (!year || isNaN(year)) {
    console.error('Usage: pnpm tsx server/scripts/exportYearToCSV.ts <year>');
    console.error('Example: pnpm tsx server/scripts/exportYearToCSV.ts 2020');
    process.exit(1);
  }

  await exportYear(year);
}

main().catch(console.error);
