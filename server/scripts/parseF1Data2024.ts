#!/usr/bin/env node
/**
 * Parse F1-Data-2024.csv (Japanese format) and convert to standard 3-file CSV format
 *
 * Usage: pnpm tsx server/scripts/parseF1Data2024.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Japanese race name to English mapping
const raceNameMap: Record<string, { name: string; location: string }> = {
  'バーレーンGP': { name: 'Bahrain Grand Prix', location: 'Sakhir, Bahrain' },
  'サウジアラビアGP': { name: 'Saudi Arabian Grand Prix', location: 'Jeddah, Saudi Arabia' },
  'オーストラリアGP': { name: 'Australian Grand Prix', location: 'Melbourne, Australia' },
  '日本GP': { name: 'Japanese Grand Prix', location: 'Suzuka, Japan' },
  '中国GP': { name: 'Chinese Grand Prix', location: 'Shanghai, China' },
  'マイアミGP': { name: 'Miami Grand Prix', location: 'Miami, USA' },
  'エミリア・ロマーニャGP': { name: 'Emilia Romagna Grand Prix', location: 'Imola, Italy' },
  'モナコGP': { name: 'Monaco Grand Prix', location: 'Monte Carlo, Monaco' },
  'カナダGP': { name: 'Canadian Grand Prix', location: 'Montreal, Canada' },
  'スペインGP': { name: 'Spanish Grand Prix', location: 'Barcelona, Spain' },
  'オーストリアGP': { name: 'Austrian Grand Prix', location: 'Spielberg, Austria' },
  'イギリスGP': { name: 'British Grand Prix', location: 'Silverstone, UK' },
  'ハンガリーGP': { name: 'Hungarian Grand Prix', location: 'Budapest, Hungary' },
  'ベルギーGP': { name: 'Belgian Grand Prix', location: 'Spa-Francorchamps, Belgium' },
  'オランダGP': { name: 'Dutch Grand Prix', location: 'Zandvoort, Netherlands' },
  'イタリアGP': { name: 'Italian Grand Prix', location: 'Monza, Italy' },
  'アゼルバイジャンGP': { name: 'Azerbaijan Grand Prix', location: 'Baku, Azerbaijan' },
  'シンガポールGP': { name: 'Singapore Grand Prix', location: 'Singapore' },
  'アメリカGP': { name: 'United States Grand Prix', location: 'Austin, USA' },
  'メキシコGP': { name: 'Mexico City Grand Prix', location: 'Mexico City, Mexico' },
  'ブラジルGP': { name: 'Brazilian Grand Prix', location: 'São Paulo, Brazil' },
  'ラスベガスGP': { name: 'Las Vegas Grand Prix', location: 'Las Vegas, USA' },
  'カタールGP': { name: 'Qatar Grand Prix', location: 'Lusail, Qatar' },
  'アブダビGP': { name: 'Abu Dhabi Grand Prix', location: 'Abu Dhabi, UAE' }
};

// Japanese driver name to driver code mapping
const driverCodeMap: Record<string, string> = {
  'マックス・フェルスタッペン': 'VER',
  'セルジオ・ペレス': 'PER',
  'ルイス・ハミルトン': 'HAM',
  'ジョージ・ラッセル': 'RUS',
  'シャルル・ルクレール': 'LEC',
  'カルロス・サインツ': 'SAI',
  'ランド・ノリス': 'NOR',
  'オスカー・ピアストリ': 'PIA',
  'フェルナンド・アロンソ': 'ALO',
  'ランス・ストロール': 'STR',
  '角田裕毅': 'TSU',
  'ダニエル・リカルド': 'RIC',
  'ピエール・ガスリー': 'GAS',
  'エステバン・オコン': 'OCO',
  'アレクサンダー・アルボン': 'ALB',
  'ローガン・サージェント': 'SAR',
  'ニコ・ヒュルケンベルグ': 'HUL',
  'ケビン・マグヌッセン': 'MAG',
  '周冠宇': 'ZHO',
  'バルテリ・ボッタス': 'BOT',
  'オリバー・ベアマン': 'BEA'
};

// English driver names
const driverNameMap: Record<string, string> = {
  'マックス・フェルスタッペン': 'Max Verstappen',
  'セルジオ・ペレス': 'Sergio Perez',
  'ルイス・ハミルトン': 'Lewis Hamilton',
  'ジョージ・ラッセル': 'George Russell',
  'シャルル・ルクレール': 'Charles Leclerc',
  'カルロス・サインツ': 'Carlos Sainz',
  'ランド・ノリス': 'Lando Norris',
  'オスカー・ピアストリ': 'Oscar Piastri',
  'フェルナンド・アロンソ': 'Fernando Alonso',
  'ランス・ストロール': 'Lance Stroll',
  '角田裕毅': 'Yuki Tsunoda',
  'ダニエル・リカルド': 'Daniel Ricciardo',
  'ピエール・ガスリー': 'Pierre Gasly',
  'エステバン・オコン': 'Esteban Ocon',
  'アレクサンダー・アルボン': 'Alexander Albon',
  'ローガン・サージェント': 'Logan Sargeant',
  'ニコ・ヒュルケンベルグ': 'Nico Hulkenberg',
  'ケビン・マグヌッセン': 'Kevin Magnussen',
  '周冠宇': 'Zhou Guanyu',
  'バルテリ・ボッタス': 'Valtteri Bottas',
  'オリバー・ベアマン': 'Oliver Bearman'
};

// Team name mapping
const teamNameMap: Record<string, string> = {
  'Red Bull Racing Honda RBPT': 'Red Bull Racing',
  'Ferrari': 'Ferrari',
  'Mercedes': 'Mercedes',
  'McLaren': 'McLaren',
  'Aston Martin Aramco Mercedes': 'Aston Martin',
  'RB Honda RBPT': 'RB',
  'Alpine Renault': 'Alpine',
  'Williams Mercedes': 'Williams',
  'Haas Ferrari': 'Haas',
  'Kick Sauber-Ferrari': 'Kick Sauber'
};

interface RaceData {
  round: number;
  raceName: string;
  raceNameJa: string;
  circuit: string;
  location: string;
  date: string;
  results: ResultData[];
}

interface ResultData {
  position: string;
  driverCode: string;
  driverName: string;
  team: string;
  laps: string;
  time: string;
  grid: string;
  points: string;
}

async function parseF1Data2024() {
  console.log('\nParsing F1-Data-2024.csv...');

  const csvPath = path.join(process.cwd(), 'F1-Data-2024.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);

  const races: RaceData[] = [];
  let currentRace: RaceData | null = null;
  let isReadingResults = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Remove BOM and quotes
    const cleanLine = line.replace(/^\ufeff/, '').replace(/^"/, '').replace(/"$/, '');

    // Check if this is a race header line
    if (cleanLine.startsWith('ラウンド,レース名')) {
      isReadingResults = false;
      continue;
    }

    // Parse race info line
    const raceMatch = cleanLine.match(/^(\d+),(.*?)GP,.*?,.*?,(\d{4}\/\d{1,2}\/\d{1,2}),(.*?)$/);
    if (raceMatch) {
      if (currentRace) {
        races.push(currentRace);
      }

      const [, round, raceName, dateStr, circuit] = raceMatch;
      const raceNameJa = raceName + 'GP';
      const raceInfo = raceNameMap[raceNameJa];

      // Parse date (format: 2024/3/2)
      const dateParts = dateStr.split('/');
      const year = dateParts[0];
      const month = dateParts[1].padStart(2, '0');
      const day = dateParts[2].padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      currentRace = {
        round: parseInt(round),
        raceName: raceInfo?.name || `${raceName} Grand Prix`,
        raceNameJa,
        circuit: circuit,
        location: raceInfo?.location || '',
        date: formattedDate,
        results: []
      };
      continue;
    }

    // Check if this is a results header line
    if (cleanLine.startsWith('順位,No.,ドライバー名')) {
      isReadingResults = true;
      continue;
    }

    // Parse result line
    if (isReadingResults && currentRace) {
      const parts = cleanLine.split(',');

      // Skip empty or malformed lines
      if (parts.length < 7) continue;

      const position = parts[0].replace(/Ret/, '');
      const driverNameJa = parts[2];
      const teamJa = parts[3];
      const laps = parts[4];
      const time = parts[5];
      const grid = parts[6];
      const points = parts[7] || '0';

      // Skip lines without driver names
      if (!driverNameJa) continue;

      const driverCode = driverCodeMap[driverNameJa] || '';
      const driverName = driverNameMap[driverNameJa] || driverNameJa;
      const team = teamNameMap[teamJa] || teamJa;

      currentRace.results.push({
        position,
        driverCode,
        driverName,
        team,
        laps,
        time,
        grid,
        points
      });
    }
  }

  // Add the last race
  if (currentRace) {
    races.push(currentRace);
  }

  console.log(`  Found ${races.length} races with results`);

  // Generate CSV files
  generateCSVFiles(races);
}

function generateCSVFiles(races: RaceData[]) {
  // 1. Races CSV
  const racesCSV: string[] = ['round,race_name,race_name_ja,circuit,location,date_start,date_end'];
  races.forEach(race => {
    racesCSV.push([
      race.round,
      escapeCSV(race.raceName),
      escapeCSV(race.raceNameJa),
      escapeCSV(race.circuit),
      escapeCSV(race.location),
      race.date,
      race.date
    ].join(','));
  });

  const racesFile = path.join(process.cwd(), 'F1-2024-races.csv');
  fs.writeFileSync(racesFile, racesCSV.join('\n'), 'utf-8');
  console.log(`  ✅ Created ${racesFile}`);

  // 2. Sessions CSV (empty for now, as we don't have session data)
  const sessionsCSV: string[] = ['round,session_name,session_date,time_utc,time_jst'];
  const sessionsFile = path.join(process.cwd(), 'F1-2024-sessions.csv');
  fs.writeFileSync(sessionsFile, sessionsCSV.join('\n'), 'utf-8');
  console.log(`  ✅ Created ${sessionsFile} (no session data)`);

  // 3. Results CSV
  const resultsCSV: string[] = ['round,position,driver_code,driver_name,team,points,grid,laps,time,status'];
  let totalResults = 0;

  races.forEach(race => {
    race.results.forEach(result => {
      // Determine status
      let status = 'Finished';
      if (result.time.includes('リタイア')) {
        status = result.time.replace('リタイア', 'Retired');
      } else if (result.time.includes('lap')) {
        status = 'Finished';
      }

      resultsCSV.push([
        race.round,
        result.position || '0',
        escapeCSV(result.driverCode),
        escapeCSV(result.driverName),
        escapeCSV(result.team),
        result.points || '0',
        result.grid || '0',
        escapeCSV(result.laps),
        escapeCSV(result.time),
        escapeCSV(status)
      ].join(','));
      totalResults++;
    });
  });

  const resultsFile = path.join(process.cwd(), 'F1-2024-results.csv');
  fs.writeFileSync(resultsFile, resultsCSV.join('\n'), 'utf-8');
  console.log(`  ✅ Created ${resultsFile} (${totalResults} results)`);

  console.log(`\n✅ Successfully generated 2024 CSV files`);
  console.log(`\nFiles created:`);
  console.log(`  - F1-2024-races.csv (${races.length} races)`);
  console.log(`  - F1-2024-sessions.csv (no sessions)`);
  console.log(`  - F1-2024-results.csv (${totalResults} results)`);
  console.log(`\nNext step: Run 'pnpm tsx server/scripts/parseYearlyCSV.ts 2024' to import into f1_data.json`);
}

function escapeCSV(value: string): string {
  if (!value) return '';

  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

async function main() {
  await parseF1Data2024();
}

main().catch(console.error);
