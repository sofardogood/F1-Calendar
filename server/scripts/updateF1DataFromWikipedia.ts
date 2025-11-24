#!/usr/bin/env node
/**
 * WikipediaからF1データを取得して更新するスクリプト
 *
 * 使用方法:
 * pnpm tsx server/scripts/updateF1DataFromWikipedia.ts
 */

import { scrapeWikipediaSchedule, scrapeRaceDetails } from '../services/wikipediaScraper.js';
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

    // 既存のデータを読み込む
    const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
    let currentData: any = {};
    try {
      currentData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    } catch (e) {
      console.warn('Could not read existing f1_data.json, starting fresh.');
    }

    // 既存のセッション情報をマップ化 (round -> sessions)
    const existingSessionsMap = new Map<number, any[]>();
    if (currentData.races) {
      currentData.races.forEach((r: any) => {
        if (r.sessions && r.sessions.length > 0) {
          existingSessionsMap.set(r.round, r.sessions);
        }
      });
    }
    // races_by_yearからも取得
    if (currentData.races_by_year && currentData.races_by_year[currentYear]) {
      currentData.races_by_year[currentYear].forEach((r: any) => {
        if (r.sessions && r.sessions.length > 0) {
          existingSessionsMap.set(r.round, r.sessions);
        }
      });
    }

    // 2025年のスケジュールをWikipediaから取得
    console.log(`Fetching ${currentYear} schedule from Wikipedia...`);
    const races2025 = await scrapeWikipediaSchedule(currentYear);
    console.log(`✓ Fetched ${races2025.length} races from Wikipedia\n`);

    // 各レースの詳細情報を取得（セッション時間など）
    console.log('Fetching race details (sessions) for 2025...');
    for (const race of races2025) {
      if (race.url) {
        try {
          // API制限を考慮して少し待機
          await new Promise(resolve => setTimeout(resolve, 1000));
          const sessions = await scrapeRaceDetails(race.url, currentYear);
          if (sessions.length > 0) {
            race.sessions = sessions;
            console.log(`  ✓ Fetched sessions for Round ${race.round}: ${race.name}`);
          }
        } catch (err) {
          console.warn(`  ⚠ Failed to fetch details for ${race.name}:`, err);
        }
      }

      // スクレイピングでセッションが取得できなかった場合、既存のデータがあればそれを使用
      if ((!race.sessions || race.sessions.length === 0) && existingSessionsMap.has(race.round)) {
        race.sessions = existingSessionsMap.get(race.round);
        console.log(`  ✓ Preserved existing sessions for Round ${race.round}: ${race.name}`);
      }
    }
    console.log('');

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
    // dataPath and currentData are already declared above
    // const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
    // const currentData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

    // Re-read current data to ensure we have the latest if needed, or just use the one we read at the start
    // Actually, we should use the one read at the start to preserve structure, but we might want to re-read if other processes updated it?
    // For now, let's just reuse the variables but re-read the file to be safe, or just use the object we already have.
    // The original code re-read it. Let's re-read it into the existing variable.
    try {
      currentData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
    } catch (e) {
      // Ignore if failed, we'll just use what we have or empty
    }

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
