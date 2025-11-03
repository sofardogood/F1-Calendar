#!/usr/bin/env node
import { scrapeWikipediaSchedule } from '../services/wikipediaScraper.js';

async function main() {
  const races = await scrapeWikipediaSchedule(2025);
  console.log('Total races:', races.length);
  console.log('\nAll rounds:', races.map(r => r.round).join(', '));
  console.log('\nRace details:');
  races.forEach(r => {
    console.log(`Round ${r.round}: ${r.name_ja || r.name} at ${r.circuit}`);
  });
}

main();
