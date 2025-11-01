/**
 * Ergast Developer API Service
 * Fetches F1 data from the Ergast API (covers 2005-2024)
 */

const ERGAST_BASE_URL = 'https://ergast.com/api/f1';

export interface ErgastRace {
  season: string;
  round: string;
  url: string;
  raceName: string;
  date: string;
  time: string;
  Circuit: {
    circuitId: string;
    url: string;
    circuitName: string;
    Location: {
      lat: string;
      long: string;
      locality: string;
      country: string;
    };
  };
  Results?: Array<{
    number: string;
    position: string;
    positionText: string;
    points: string;
    Driver: {
      driverId: string;
      code: string;
      url: string;
      givenName: string;
      familyName: string;
      dateOfBirth: string;
      nationality: string;
    };
    Constructor: {
      constructorId: string;
      url: string;
      name: string;
      nationality: string;
    };
    grid: string;
    laps: string;
    status: string;
    FastestLap?: {
      rank: string;
      lap: string;
      Time: {
        millis: string;
        time: string;
      };
    };
  }>;
}

export interface ErgastResponse {
  MRData: {
    xmlns: string;
    series: string;
    url: string;
    limit: string;
    offset: string;
    total: string;
    RaceTable: {
      season: string;
      Races: ErgastRace[];
    };
  };
}

export async function getSeasonRaces(season: number): Promise<ErgastRace[]> {
  try {
    const response = await fetch(`${ERGAST_BASE_URL}/${season}.json`);
    if (!response.ok) {
      throw new Error(`Ergast API error: ${response.statusText}`);
    }
    const data: ErgastResponse = await response.json();
    return data.MRData.RaceTable.Races || [];
  } catch (error) {
    console.error(`Failed to fetch season ${season} from Ergast:`, error);
    return [];
  }
}

export async function getSeasonDriverStandings(season: number): Promise<any[]> {
  try {
    const response = await fetch(`${ERGAST_BASE_URL}/${season}/driverStandings.json`);
    if (!response.ok) {
      throw new Error(`Ergast API error: ${response.statusText}`);
    }
    const data: any = await response.json();
    return data.MRData.StandingsTable.StandingsList?.[0]?.DriverStandings || [];
  } catch (error) {
    console.error(`Failed to fetch driver standings for season ${season}:`, error);
    return [];
  }
}

export async function getSeasonConstructorStandings(season: number): Promise<any[]> {
  try {
    const response = await fetch(`${ERGAST_BASE_URL}/${season}/constructorStandings.json`);
    if (!response.ok) {
      throw new Error(`Ergast API error: ${response.statusText}`);
    }
    const data: any = await response.json();
    return data.MRData.StandingsTable.StandingsList?.[0]?.ConstructorStandings || [];
  } catch (error) {
    console.error(`Failed to fetch constructor standings for season ${season}:`, error);
    return [];
  }
}

export async function getRaceResults(season: number, round: number): Promise<any> {
  try {
    const response = await fetch(`${ERGAST_BASE_URL}/${season}/${round}/results.json`);
    if (!response.ok) {
      throw new Error(`Ergast API error: ${response.statusText}`);
    }
    const data: any = await response.json();
    return data.MRData.RaceTable.Races?.[0] || null;
  } catch (error) {
    console.error(`Failed to fetch race results for ${season} round ${round}:`, error);
    return null;
  }
}
