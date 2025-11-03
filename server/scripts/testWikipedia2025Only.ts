#!/usr/bin/env node
/**
 * 2025年のみWikipediaから取得してテスト
 */

import { scrapeWikipediaSchedule } from '../services/wikipediaScraper.js';
import { fetchAllRaceResults } from '../services/ergastApi.js';

async function main() {
  try {
    console.log('Testing 2025 Wikipedia scraper...\n');

    const currentYear = 2025;

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

    console.log(`✓ Fetched results for ${Object.keys(results2025).length} completed races\n`);

    console.log('\n✓ Test successful!');
    console.log(`\nSummary:`);
    console.log(`  Total races: ${racesWithResults2025.length}`);
    const racesWithResults = racesWithResults2025.filter((r: any) => r.results && r.results.length > 0);
    console.log(`  Races with results: ${racesWithResults.length}`);

    console.log('\nFirst 3 races:');
    racesWithResults2025.slice(0, 3).forEach((race: any) => {
      console.log(`  Round ${race.round}: ${race.name_ja || race.name}`);
      console.log(`    Circuit: ${race.circuit}`);
      console.log(`    Location: ${race.location}`);
      console.log(`    Date: ${race.date_start}`);
      console.log(`    Has results: ${race.results ? 'Yes' : 'No'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Test failed:', error);
    process.exit(1);
  }
}

main();
