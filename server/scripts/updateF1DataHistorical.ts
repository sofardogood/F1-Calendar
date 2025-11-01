#!/usr/bin/env node
/**
 * F1スケジュールデータを最新情報に更新するスクリプト（2000年〜2025年）
 *
 * 使用方法:
 * pnpm tsx server/scripts/updateF1DataHistorical.ts
 */

import { scrapeF1Schedule } from '../services/f1Scraper.js';
import { fetchAllRaceResults } from '../services/ergastApi.js';
import fs from 'fs/promises';
import path from 'path';

interface RaceInfo {
  round: number;
  name: string;
  name_ja?: string;
  circuit: string;
  location: string;
  date_start: string;
  date_end: string;
  sessions?: any[];
  results?: any[];
}

async function main() {
  try {
    console.log('Starting F1 data update (2000-2025)...');

    // 2025年のレーススケジュールを取得
    console.log('Fetching 2025 schedule...');
    const races2025 = await scrapeF1Schedule();

    // 年度別のレースデータを格納
    const racesByYear: Record<number, RaceInfo[]> = {};

    // 2000年から2024年までのレース結果を取得
    const startYear = 2000;
    const endYear = 2024;

    for (let year = startYear; year <= endYear; year++) {
      console.log(`\nFetching ${year} race results...`);
      const results = await fetchAllRaceResults(year, 24);

      // 結果があるラウンドのみレース情報を作成
      const racesForYear: RaceInfo[] = [];
      Object.entries(results).forEach(([roundStr, raceResults]) => {
        const round = parseInt(roundStr);
        if (raceResults && raceResults.length > 0) {
          racesForYear.push({
            round,
            name: `Round ${round}`,
            name_ja: `第${round}戦`,
            circuit: '',
            location: '',
            date_start: `${year}-01-01`,
            date_end: `${year}-12-31`,
            sessions: [],
            results: raceResults
          });
        }
      });

      if (racesForYear.length > 0) {
        racesByYear[year] = racesForYear;
        console.log(`  ✓ Fetched ${racesForYear.length} races from ${year}`);
      }

      // API制限を考慮して待つ（5秒）
      if (year < endYear) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    // 2025年のレース結果を取得してマージ
    console.log('\nFetching 2025 race results...');
    const results2025 = await fetchAllRaceResults(2025, races2025.length);

    const racesWithResults2025 = races2025.map((race: any) => {
      const results = results2025[race.round];
      return results ? { ...race, results } : race;
    });

    racesByYear[2025] = racesWithResults2025;
    console.log(`  ✓ Fetched ${racesWithResults2025.length} races from 2025`);

    // f1_data.jsonを更新
    console.log('\nUpdating f1_data.json...');
    const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
    const currentData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

    // 既存のドライバー/コンストラクター情報は保持し、年度別のレースデータを追加
    const updatedData = {
      ...currentData,
      races_by_year: racesByYear,
      current_season: 2025,
      last_updated: new Date().toISOString()
    };

    await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));

    console.log('\n✓ f1_data.json updated successfully!');
    console.log(`\nSummary:`);
    console.log(`  Total years: ${Object.keys(racesByYear).length} (2000-2025)`);
    console.log(`  Total races: ${Object.values(racesByYear).reduce((sum, races) => sum + races.length, 0)}`);

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Failed to update F1 data:', error);
    process.exit(1);
  }
}

main();
