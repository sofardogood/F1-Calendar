#!/usr/bin/env node
/**
 * WikipediaからF1データを取得して更新するスクリプト
 *
 * 使用方法:
 * pnpm tsx server/scripts/updateF1DataFromWikipedia.ts
 */

import { scrapeWikipediaSchedule } from '../services/wikipediaScraper.js';
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
    console.log('Starting F1 data update from Wikipedia...\n');

    const currentYear = 2025;
    const racesByYear: Record<number, RaceInfo[]> = {};

    // 2025年のスケジュールをWikipediaから取得
    console.log(`Fetching ${currentYear} schedule from Wikipedia...`);
    const races2025 = await scrapeWikipediaSchedule(currentYear);
    console.log(`✓ Fetched ${races2025.length} races from Wikipedia\n`);

    // 2025年のレース結果をErgast APIから取得してマージ
    console.log(`Fetching ${currentYear} race results from Ergast API...`);
    const results2025 = await fetchAllRaceResults(currentYear, races2025.length);

    const racesWithResults2025 = races2025.map((race: any) => {
      const results = results2025[race.round];
      return results ? { ...race, results } : race;
    });

    racesByYear[currentYear] = racesWithResults2025;
    console.log(`✓ Fetched results for ${Object.keys(results2025).length} completed races\n`);

    // 過去5年間のデータを取得（2020-2024）
    const startYear = 2020;
    const endYear = 2024;

    for (let year = startYear; year <= endYear; year++) {
      console.log(`Fetching ${year} data...`);

      // Wikipediaからスケジュール情報を取得
      try {
        const racesForYear = await scrapeWikipediaSchedule(year);
        console.log(`  ✓ Scraped ${racesForYear.length} races from Wikipedia`);

        // Ergast APIからレース結果を取得
        const results = await fetchAllRaceResults(year, racesForYear.length);

        // 結果をマージ
        const racesWithResults = racesForYear.map((race: any) => {
          const raceResults = results[race.round];
          return raceResults ? { ...race, results: raceResults } : race;
        });

        racesByYear[year] = racesWithResults;
        console.log(`  ✓ Fetched results for ${Object.keys(results).length} races`);
      } catch (error) {
        console.error(`  ✗ Error fetching ${year} data:`, error);

        // フォールバック: Ergast APIのみから取得
        console.log(`  → Falling back to Ergast API only...`);
        const results = await fetchAllRaceResults(year, 24);

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
          console.log(`  ✓ Fetched ${racesForYear.length} races from Ergast API`);
        }
      }

      // API制限を考慮して待つ
      if (year < endYear) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      console.log('');
    }

    // f1_data.jsonを更新
    console.log('Updating f1_data.json...');
    const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
    const currentData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

    // 既存のドライバー/コンストラクター情報は保持し、年度別のレースデータを追加
    const updatedData = {
      ...currentData,
      races_by_year: racesByYear,
      current_season: currentYear,
      last_updated: new Date().toISOString()
    };

    await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));

    console.log('\n✓ f1_data.json updated successfully!');
    console.log(`\nSummary:`);
    console.log(`  Total years: ${Object.keys(racesByYear).length} (${startYear}-${currentYear})`);
    console.log(`  Total races: ${Object.values(racesByYear).reduce((sum, races) => sum + races.length, 0)}`);

    Object.entries(racesByYear).forEach(([year, races]) => {
      const racesWithResults = races.filter((r: any) => r.results && r.results.length > 0);
      console.log(`  ${year}: ${races.length} races (${racesWithResults.length} with results)`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Failed to update F1 data:', error);
    process.exit(1);
  }
}

main();
