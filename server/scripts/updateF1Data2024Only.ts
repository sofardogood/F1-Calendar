#!/usr/bin/env node
/**
 * F1スケジュールデータを最新情報に更新するスクリプト（2024年と2025年のみ）
 *
 * 使用方法:
 * pnpm tsx server/scripts/updateF1Data2024Only.ts
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
    console.log('Starting F1 data update (2024 and 2025 only)...');

    // 2025年のレーススケジュールを取得
    const races2025 = await scrapeF1Schedule();

    // 2024年のレース結果を取得
    console.log('Fetching 2024 race results...');
    const results2024 = await fetchAllRaceResults(2024, 24);

    // 2024年のレースデータを作成
    const races2024: RaceInfo[] = [];
    Object.entries(results2024).forEach(([roundStr, raceResults]) => {
      const round = parseInt(roundStr);
      if (raceResults && raceResults.length > 0) {
        races2024.push({
          round,
          name: `Round ${round}`,
          name_ja: `第${round}戦`,
          circuit: '',
          location: '',
          date_start: '2024-01-01',
          date_end: '2024-12-31',
          sessions: [],
          results: raceResults
        });
      }
    });

    // 2025年のレース結果を取得
    console.log('Fetching 2025 race results...');
    const results2025 = await fetchAllRaceResults(2025, races2025.length);

    // 2025年のレースに結果をマージ
    const racesWithResults2025 = races2025.map((race: any) => {
      const results = results2025[race.round];
      return results ? { ...race, results } : race;
    });

    // f1_data.jsonを更新
    const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
    const currentData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

    // 既存のドライバー/コンストラクター情報は保持し、年度別のレースデータを追加
    const updatedData = {
      ...currentData,
      races_by_year: {
        2024: races2024,
        2025: racesWithResults2025
      },
      current_season: 2025,
      last_updated: new Date().toISOString()
    };

    await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
    console.log('f1_data.json updated successfully!');
    console.log(`Updated ${races2024.length} races from 2024`);
    console.log(`Updated ${racesWithResults2025.length} races from 2025`);

    process.exit(0);
  } catch (error) {
    console.error('Failed to update F1 data:', error);
    process.exit(1);
  }
}

main();
