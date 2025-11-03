#!/usr/bin/env node
/**
 * Add 2024 Sprint Points to f1_data.json
 *
 * Usage: pnpm tsx server/scripts/add2024SprintPoints.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const sprintPoints: Record<string, number> = {
  'VER': 38,
  'NOR': 30,
  'LEC': 29,
  'SAI': 28,
  'PIA': 27,
  'RUS': 19,
  'HAM': 16,
  'PER': 14,
  'RIC': 5,
  'HUL': 5,
  'MAG': 2,
  'GAS': 2,
  'TSU': 1
};

async function addSprintPoints() {
  console.log('\n🏁 Adding 2024 Sprint Points to f1_data.json...\n');

  const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const races2024 = data.races_by_year['2024'];

  if (!races2024) {
    console.error('❌ No 2024 data found in f1_data.json');
    process.exit(1);
  }

  // Create a map of driver codes to total race points (excluding sprints)
  const driverTotalPoints: Record<string, { name: string; team: string; racePoints: number; sprintPoints: number }> = {};

  races2024.forEach((race: any) => {
    if (race.results && race.results.length > 0) {
      race.results.forEach((result: any) => {
        const { driver, driver_code, team, points } = result;

        if (!driverTotalPoints[driver_code]) {
          driverTotalPoints[driver_code] = {
            name: driver,
            team,
            racePoints: 0,
            sprintPoints: 0
          };
        }
        driverTotalPoints[driver_code].racePoints += points;
      });
    }
  });

  // Add sprint points
  Object.entries(sprintPoints).forEach(([code, points]) => {
    if (driverTotalPoints[code]) {
      driverTotalPoints[code].sprintPoints = points;
    } else {
      console.warn(`⚠️  Driver ${code} has sprint points but no race results`);
    }
  });

  // Calculate totals and display
  const standings = Object.entries(driverTotalPoints).map(([code, data]) => ({
    code,
    name: data.name,
    team: data.team,
    racePoints: data.racePoints,
    sprintPoints: data.sprintPoints,
    totalPoints: data.racePoints + data.sprintPoints
  })).sort((a, b) => b.totalPoints - a.totalPoints);

  console.log('=== 2024 Final Championship Standings (with Sprint Points) ===\n');
  standings.slice(0, 10).forEach((driver, index) => {
    console.log(
      `${index + 1}. ${driver.name} (${driver.code}): ` +
      `${driver.totalPoints}pts (Race: ${driver.racePoints} + Sprint: ${driver.sprintPoints})`
    );
  });

  console.log(`\n✅ Sprint points calculated`);
  console.log(`   Total race points: ${standings.reduce((sum, d) => sum + d.racePoints, 0)}`);
  console.log(`   Total sprint points: ${standings.reduce((sum, d) => sum + d.sprintPoints, 0)}`);
  console.log(`   Grand total: ${standings.reduce((sum, d) => sum + d.totalPoints, 0)}`);

  // Update data
  data.sprint_points_2024 = sprintPoints;

  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  console.log(`\n✅ Updated client/src/f1_data.json with sprint points`);
}

async function main() {
  await addSprintPoints();
}

main().catch(console.error);
