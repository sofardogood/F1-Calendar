#!/usr/bin/env node
/**
 * F1スケジュールデータを最新情報に更新するスクリプト（2024年のみ）
 *
 * 使用方法:
 * pnpm tsx server/scripts/updateF1Data2024Only.ts
 */

import { scrapeF1Schedule } from '../services/f1Scraper.js';
import { fetchAllRaceResults } from '../services/ergastApi.js';
import fs from 'fs/promises';
import path from 'path';

async function main() {
  try {
    console.log('Starting F1 data update (2024 only)...');

    // レーススケジュールを取得
    const races = await scrapeF1Schedule();

    // 2024年のレース結果を取得
    console.log('Fetching 2024 race results...');
    const results2024 = await fetchAllRaceResults(2024, 24);

    // レース結果をマージ
    const racesWithResults = races.map(race => {
      const results = results2024[race.round];
      return results ? { ...race, results } : race;
    });

    // f1_data.jsonを更新
    const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
    const currentData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));

    // 既存のドライバー/コンストラクター情報は保持
    const updatedData = {
      ...currentData,
      races: racesWithResults,
      last_updated: new Date().toISOString()
    };

    await fs.writeFile(dataPath, JSON.stringify(updatedData, null, 2));
    console.log('f1_data.json updated successfully!');
    console.log(`Updated ${Object.keys(results2024).length} results from 2024`);

    process.exit(0);
  } catch (error) {
    console.error('Failed to update F1 data:', error);
    process.exit(1);
  }
}

main();
