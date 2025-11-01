/**
 * Ergast API を使用してF1レース結果を取得
 * API: http://ergast.com/mrd/
 */

interface ErgastDriver {
  driverId: string;
  givenName: string;
  familyName: string;
  code?: string;
}

interface ErgastConstructor {
  constructorId: string;
  name: string;
}

interface ErgastResult {
  position: string;
  Driver: ErgastDriver;
  Constructor: ErgastConstructor;
  points: string;
  Time?: {
    time: string;
  };
  status: string;
}

interface ErgastRace {
  round: string;
  raceName: string;
  Results?: ErgastResult[];
}

export interface RaceResult {
  position: number;
  driver: string;
  driver_code: string;
  team: string;
  points: number;
  time?: string;
  status: string;
}

/**
 * 指定されたシーズンとラウンドのレース結果を取得
 */
export async function fetchRaceResults(season: number, round: number): Promise<RaceResult[] | null> {
  try {
    // HTTPを使用（HTTPSに問題がある場合のフォールバック）
    const url = `http://ergast.com/api/f1/${season}/${round}/results.json`;
    console.log(`Fetching race results from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch results for ${season} round ${round}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const raceData = data.MRData?.RaceTable?.Races?.[0] as ErgastRace | undefined;

    if (!raceData || !raceData.Results) {
      console.log(`No results available for ${season} round ${round}`);
      return null;
    }

    const results: RaceResult[] = raceData.Results.map((result) => ({
      position: parseInt(result.position),
      driver: `${result.Driver.givenName} ${result.Driver.familyName}`,
      driver_code: result.Driver.code || result.Driver.driverId.substring(0, 3).toUpperCase(),
      team: result.Constructor.name,
      points: parseFloat(result.points),
      time: result.Time?.time,
      status: result.status
    }));

    console.log(`Fetched ${results.length} results for round ${round}`);
    return results;
  } catch (error) {
    console.error(`Error fetching race results for ${season} round ${round}:`, error);
    return null;
  }
}

/**
 * 全レースの結果を取得（完了したレースのみ）
 */
export async function fetchAllRaceResults(season: number, totalRounds: number): Promise<Record<number, RaceResult[]>> {
  const results: Record<number, RaceResult[]> = {};

  console.log(`Fetching results for all races in ${season}...`);

  // 並列でAPIリクエストを送信（最大5件ずつ）
  const batchSize = 5;
  for (let i = 1; i <= totalRounds; i += batchSize) {
    const batch = [];
    for (let round = i; round < i + batchSize && round <= totalRounds; round++) {
      batch.push(
        fetchRaceResults(season, round).then(result => ({ round, result }))
      );
    }

    const batchResults = await Promise.all(batch);
    batchResults.forEach(({ round, result }) => {
      if (result && result.length > 0) {
        results[round] = result;
      }
    });

    // API制限を考慮して少し待つ
    if (i + batchSize <= totalRounds) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`Fetched results for ${Object.keys(results).length} completed races`);
  return results;
}
