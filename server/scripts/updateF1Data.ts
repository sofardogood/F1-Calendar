#!/usr/bin/env node
/**
 * F1スケジュールデータを最新情報に更新するスクリプト
 *
 * 使用方法:
 * pnpm tsx server/scripts/updateF1Data.ts
 */

import { updateF1DataFile } from '../services/f1Scraper';

async function main() {
  try {
    console.log('Starting F1 data update...');
    await updateF1DataFile();
    console.log('F1 data update completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to update F1 data:', error);
    process.exit(1);
  }
}

main();
