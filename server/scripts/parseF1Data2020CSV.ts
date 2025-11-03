#!/usr/bin/env node
/**
 * Parse F1-Data-2020.csv and convert to application JSON format
 */

import * as fs from 'fs';
import * as path from 'path';

interface RaceResult {
  position: number;
  driver_number: string;
  driver: string;
  driver_code: string;
  team: string;
  laps: string;
  time: string;
  grid: number;
  points: number;
  status?: string;
}

interface RaceInfo {
  round: number;
  name: string;
  name_ja: string;
  circuit: string;
  location: string;
  date_start: string;
  date_end: string;
  sessions: any[];
  results?: RaceResult[];
}

// ドライバーコードのマッピング
const driverCodeMap: Record<string, string> = {
  'ルイス・ハミルトン': 'HAM',
  'バルテリ・ボッタス': 'BOT',
  'マックス・フェルスタッペン': 'VER',
  'シャルル・ルクレール': 'LEC',
  'ランド・ノリス': 'NOR',
  'カルロス・サインツ': 'SAI',
  'セルジオ・ペレス': 'PER',
  'ダニエル・リカルド': 'RIC',
  'ピエール・ガスリー': 'GAS',
  'エステバン・オコン': 'OCO',
  'アレクサンダー・アルボン': 'ALB',
  'セバスチャン・ベッテル': 'VET',
  'アントニオ・ジョヴィナッツィ': 'GIO',
  'ダニール・クビアト': 'KVY',
  'ニコラス・ラティフィ': 'LAT',
  'キミ・ライコネン': 'RAI',
  'ケビン・マグヌッセン': 'MAG',
  'ロマン・グロージャン': 'GRO',
  'ジョージ・ラッセル': 'RUS',
  'ランス・ストロール': 'STR',
  'ニコ・ヒュルケンベルグ': 'HUL',
  'ジャック・エイトケン': 'AIT',
  'ピエトロ・フィッティパルディ': 'FIT'
};

// ドライバー名の日本語→英語マッピング
const driverNameMap: Record<string, string> = {
  'ルイス・ハミルトン': 'Lewis Hamilton',
  ' ルイス・ハミルトン': 'Lewis Hamilton',
  'バルテリ・ボッタス': 'Valtteri Bottas',
  'マックス・フェルスタッペン': 'Max Verstappen',
  'シャルル・ルクレール': 'Charles Leclerc',
  'ランド・ノリス': 'Lando Norris',
  'カルロス・サインツ': 'Carlos Sainz',
  'セルジオ・ペレス': 'Sergio Perez',
  'ダニエル・リカルド': 'Daniel Ricciardo',
  'ピエール・ガスリー': 'Pierre Gasly',
  'エステバン・オコン': 'Esteban Ocon',
  'アレクサンダー・アルボン': 'Alexander Albon',
  'セバスチャン・ベッテル': 'Sebastian Vettel',
  'アントニオ・ジョヴィナッツィ': 'Antonio Giovinazzi',
  'ダニール・クビアト': 'Daniil Kvyat',
  'ニコラス・ラティフィ': 'Nicholas Latifi',
  'キミ・ライコネン': 'Kimi Raikkonen',
  'ケビン・マグヌッセン': 'Kevin Magnussen',
  'ロマン・グロージャン': 'Romain Grosjean',
  'ジョージ・ラッセル': 'George Russell',
  'ランス・ストロール': 'Lance Stroll',
  'ニコ・ヒュルケンベルグ': 'Nico Hulkenberg',
  'ジャック・エイトケン': 'Jack Aitken',
  'ピエトロ・フィッティパルディ': 'Pietro Fittipaldi'
};

// チーム名の日本語→英語マッピング
const teamNameMap: Record<string, string> = {
  'メルセデス': 'Mercedes',
  'フェラーリ': 'Ferrari',
  'マクラーレン-ルノー': 'McLaren',
  'レッドブル-ホンダ': 'Red Bull',
  'ルノー': 'Renault',
  'アルファタウリ-ホンダ': 'AlphaTauri',
  'レーシング・ポイント-BWTメルセデス': 'Racing Point',
  'アルファロメオ-フェラーリ': 'Alfa Romeo',
  'ウィリアムズ-メルセデス': 'Williams',
  'ハース-フェラーリ': 'Haas'
};

// レース名のマッピング
const raceNameMap: Record<string, { name: string; name_ja: string; location: string }> = {
  'オーストリア': { name: 'Austrian Grand Prix', name_ja: 'オーストリアGP', location: 'Spielberg, Austria' },
  'シュタイアーマルク': { name: 'Styrian Grand Prix', name_ja: 'シュタイアーマルクGP', location: 'Spielberg, Austria' },
  'ハンガリー': { name: 'Hungarian Grand Prix', name_ja: 'ハンガリーGP', location: 'Budapest, Hungary' },
  'イギリス': { name: 'British Grand Prix', name_ja: 'イギリスGP', location: 'Silverstone, UK' },
  '70周年記念': { name: '70th Anniversary Grand Prix', name_ja: '70周年記念GP', location: 'Silverstone, UK' },
  'スペイン': { name: 'Spanish Grand Prix', name_ja: 'スペインGP', location: 'Barcelona, Spain' },
  'ベルギー': { name: 'Belgian Grand Prix', name_ja: 'ベルギーGP', location: 'Spa-Francorchamps, Belgium' },
  'イタリア': { name: 'Italian Grand Prix', name_ja: 'イタリアGP', location: 'Monza, Italy' },
  'トスカーナ': { name: 'Tuscan Grand Prix', name_ja: 'トスカーナGP', location: 'Mugello, Italy' },
  'ロシア': { name: 'Russian Grand Prix', name_ja: 'ロシアGP', location: 'Sochi, Russia' },
  'アイフェル': { name: 'Eifel Grand Prix', name_ja: 'アイフェルGP', location: 'Nürburg, Germany' },
  'ポルトガル': { name: 'Portuguese Grand Prix', name_ja: 'ポルトガルGP', location: 'Portimão, Portugal' },
  'エミリア・ロマーニャ': { name: 'Emilia Romagna Grand Prix', name_ja: 'エミリア・ロマーニャGP', location: 'Imola, Italy' },
  'トルコ': { name: 'Turkish Grand Prix', name_ja: 'トルコGP', location: 'Istanbul, Turkey' },
  'バーレーン': { name: 'Bahrain Grand Prix', name_ja: 'バーレーンGP', location: 'Sakhir, Bahrain' },
  'サヒール': { name: 'Sakhir Grand Prix', name_ja: 'サヒールGP', location: 'Sakhir, Bahrain' },
  'アブダビ': { name: 'Abu Dhabi Grand Prix', name_ja: 'アブダビGP', location: 'Abu Dhabi, UAE' }
};

// サーキット名のマッピング
const circuitMap: Record<string, string> = {
  'Red Bull Ring': 'Red Bull Ring',
  'Hungaroring': 'Hungaroring',
  'Silverstone Circuit': 'Silverstone Circuit',
  'Circuit de Barcelona-Catalunya': 'Circuit de Barcelona-Catalunya',
  'Circuit de Spa-Francorchamps': 'Circuit de Spa-Francorchamps',
  'Autodromo Nazionale di Monza': 'Autodromo Nazionale di Monza',
  'Mugello Circuit': 'Mugello Circuit',
  'Sochi Autodrom': 'Sochi Autodrom',
  'Nürburgring': 'Nürburgring',
  'Algarve International Circuit': 'Algarve International Circuit',
  'Autodromo Internazionale "Enzo e Dino Ferrari"': 'Autodromo Internazionale Enzo e Dino Ferrari',
  'Istanbul Park': 'Istanbul Park',
  'Bahrain International Circuit': 'Bahrain International Circuit',
  'Yas Marina Circuit': 'Yas Marina Circuit'
};

function parseCSV(): RaceInfo[] {
  const csvPath = path.join(process.cwd(), 'F1-Data-2020.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');

  const races: RaceInfo[] = [];
  let currentRace: RaceInfo | null = null;
  let inResults = false;

  // 最初に全ラウンドとレース名のマッピングを作成
  const roundToNameMap: Record<number, string> = {};
  for (let i = 1; i < Math.min(20, lines.length); i++) {
    const cells = lines[i].split(',');
    const roundStr = cells[0]?.trim();
    const raceName = cells[1]?.trim();
    if (roundStr && raceName && /^\d+$/.test(roundStr)) {
      roundToNameMap[parseInt(roundStr)] = raceName;
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      inResults = false;
      continue;
    }

    const cells = line.split(',');

    // レースヘッダーを検出 (Rd.X の形式)
    if (cells[3]?.trim().startsWith('Rd.')) {
      if (currentRace && currentRace.results) {
        races.push(currentRace);
      }

      const roundMatch = cells[3].trim().match(/Rd\.(\d+)/);
      const round = roundMatch ? parseInt(roundMatch[1]) : 0;
      const dateStr = cells[4]?.trim() || '';
      const circuit = cells[5]?.trim() || '';

      // マッピングからレース名を取得
      const raceNameJa = roundToNameMap[round] || '';
      const raceInfo = raceNameMap[raceNameJa] || {
        name: raceNameJa + ' Grand Prix',
        name_ja: raceNameJa + 'GP',
        location: 'Unknown'
      };

      // 日付を解析 (YYYY/M/D 形式)
      let dateStart = '2020-01-01';
      if (dateStr) {
        const dateMatch = dateStr.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
        if (dateMatch) {
          const year = dateMatch[1];
          const month = dateMatch[2].padStart(2, '0');
          const day = dateMatch[3].padStart(2, '0');
          dateStart = `${year}-${month}-${day}`;
        }
      }

      currentRace = {
        round,
        name: raceInfo.name,
        name_ja: raceInfo.name_ja,
        circuit: circuitMap[circuit] || circuit,
        location: raceInfo.location,
        date_start: dateStart,
        date_end: dateStart,
        sessions: [],
        results: []
      };

      inResults = false;
      continue;
    }

    // 結果ヘッダーを検出
    if (cells[3]?.trim() === '順位' && cells[4]?.trim() === 'No.') {
      inResults = true;
      continue;
    }

    // 結果データを解析
    if (inResults && currentRace && cells[3]?.trim()) {
      const positionStr = cells[3].trim();
      let position = 0;
      let status = '';

      if (positionStr === 'Ret' || positionStr === 'DNS' || positionStr === 'WD') {
        status = 'Retired';
      } else if (positionStr.includes('†')) {
        position = parseInt(positionStr.replace('†', ''));
        status = 'Finished';
      } else {
        position = parseInt(positionStr) || 0;
        status = position > 0 ? 'Finished' : 'Retired';
      }

      const driverNumber = cells[4]?.trim() || '';
      let driverName = cells[5]?.trim() || '';

      // フラグアイコンや余分なスペースを削除
      driverName = driverName.replace(/の旗/g, '').replace(/^\s+/g, '').trim();

      let team = cells[6]?.trim() || '';
      const laps = cells[7]?.trim() || '';
      const time = cells[8]?.trim() || '';
      const gridStr = cells[9]?.trim() || '0';
      const pointsStr = cells[10]?.trim() || '0';

      // グリッド位置を解析
      let grid = 0;
      if (gridStr && gridStr !== 'PL' && gridStr !== '-') {
        grid = parseInt(gridStr) || 0;
      }

      // ポイントを解析
      let points = 0;
      if (pointsStr && pointsStr !== 'FL') {
        points = parseFloat(pointsStr) || 0;
      }

      // ドライバー名を英語に変換
      const englishDriverName = driverNameMap[driverName] || driverName;

      // チーム名を英語に変換
      const englishTeamName = teamNameMap[team] || team;

      const driverCode = driverCodeMap[driverName] || driverName.substring(0, 3).toUpperCase();

      currentRace.results!.push({
        position,
        driver_number: driverNumber,
        driver: englishDriverName,
        driver_code: driverCode,
        team: englishTeamName,
        laps,
        time,
        grid,
        points,
        status
      });
    }
  }

  // 最後のレースを追加
  if (currentRace && currentRace.results) {
    races.push(currentRace);
  }

  return races;
}

function calculateStandings(races: RaceInfo[]) {
  const driverPoints: Record<string, { name: string; code: string; team: string; points: number }> = {};
  const constructorPoints: Record<string, { name: string; points: number }> = {};

  // 全レースの結果から累積ポイントを計算
  races.forEach(race => {
    if (!race.results) return;

    race.results.forEach(result => {
      const { driver, driver_code, team, points } = result;

      // ドライバーポイント
      if (!driverPoints[driver_code]) {
        driverPoints[driver_code] = { name: driver, code: driver_code, team, points: 0 };
      }
      driverPoints[driver_code].points += points;

      // コンストラクターポイント
      if (!constructorPoints[team]) {
        constructorPoints[team] = { name: team, points: 0 };
      }
      constructorPoints[team].points += points;
    });
  });

  // ランキング順にソート
  const driversStandings = Object.values(driverPoints)
    .sort((a, b) => b.points - a.points)
    .map((driver, index) => ({
      position: index + 1,
      ...driver
    }));

  const constructorsStandings = Object.values(constructorPoints)
    .sort((a, b) => b.points - a.points)
    .map((constructor, index) => ({
      position: index + 1,
      ...constructor
    }));

  return { driversStandings, constructorsStandings };
}

async function main() {
  console.log('Parsing F1-Data-2020.csv...');

  const races = parseCSV();

  console.log(`\nParsed ${races.length} races from 2020 season\n`);

  races.forEach(race => {
    console.log(`Round ${race.round}: ${race.name_ja} (${race.date_start})`);
    console.log(`  Circuit: ${race.circuit}`);
    console.log(`  Results: ${race.results?.length || 0} drivers`);
    if (race.results && race.results.length > 0) {
      const winner = race.results[0];
      console.log(`  Winner: ${winner.driver} (${winner.driver_code})`);
    }
  });

  // ドライバーとコンストラクターの順位を計算
  const { driversStandings, constructorsStandings } = calculateStandings(races);

  console.log(`\nFinal Standings:`);
  console.log(`  Champion: ${driversStandings[0].name} (${driversStandings[0].points} pts)`);
  console.log(`  Constructor Champion: ${constructorsStandings[0].name} (${constructorsStandings[0].points} pts)`);

  // 既存のf1_data.jsonを読み込む
  const dataPath = path.join(process.cwd(), 'client/src/f1_data.json');
  const existingData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // 2020年のデータを追加
  if (!existingData.races_by_year) {
    existingData.races_by_year = {};
  }
  existingData.races_by_year[2020] = races;

  // ファイルに書き込む
  fs.writeFileSync(dataPath, JSON.stringify(existingData, null, 2));
  console.log('\n✅ Successfully added 2020 data to client/src/f1_data.json');
}

main();
