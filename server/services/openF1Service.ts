/**
 * OpenF1 API Service
 * Fetches latest F1 data from OpenF1 API (https://openf1.org/)
 * This API provides real-time and recent data for modern F1 seasons
 */

const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

export interface OpenF1Session {
  session_key: number;
  session_name: string;
  date_start: string;
  date_end: string;
  gmt_offset: string;
  session_type: string;
  meeting_key: number;
  location: string;
  country_name: string;
  circuit_key: number;
  circuit_short_name: string;
  year: number;
}

export interface OpenF1Meeting {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  location: string;
  country_name: string;
  circuit_key: number;
  circuit_short_name: string;
  date_start: string;
  year: number;
}

export interface OpenF1Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  first_name: string;
  last_name: string;
  headshot_url: string;
  country_code: string;
}

/**
 * Get all sessions for a specific year
 */
export async function getSessionsByYear(year: number): Promise<OpenF1Session[]> {
  try {
    const response = await fetch(`${OPENF1_BASE_URL}/sessions?year=${year}`);
    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.statusText}`);
    }
    const data: OpenF1Session[] = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch sessions for year ${year} from OpenF1:`, error);
    return [];
  }
}

/**
 * Get all meetings (race weekends) for a specific year
 */
export async function getMeetingsByYear(year: number): Promise<OpenF1Meeting[]> {
  try {
    const response = await fetch(`${OPENF1_BASE_URL}/meetings?year=${year}`);
    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.statusText}`);
    }
    const data: OpenF1Meeting[] = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch meetings for year ${year} from OpenF1:`, error);
    return [];
  }
}

/**
 * Get latest session (most recent or upcoming)
 */
export async function getLatestSession(): Promise<OpenF1Session | null> {
  try {
    const currentYear = new Date().getFullYear();
    const sessions = await getSessionsByYear(currentYear);

    if (sessions.length === 0) {
      return null;
    }

    // Sort by date and return the most recent/upcoming session
    const sorted = sessions.sort((a, b) =>
      new Date(b.date_start).getTime() - new Date(a.date_start).getTime()
    );

    return sorted[0];
  } catch (error) {
    console.error('Failed to fetch latest session from OpenF1:', error);
    return null;
  }
}

/**
 * Get all drivers for a specific session
 */
export async function getDriversBySession(sessionKey: number): Promise<OpenF1Driver[]> {
  try {
    const response = await fetch(`${OPENF1_BASE_URL}/drivers?session_key=${sessionKey}`);
    if (!response.ok) {
      throw new Error(`OpenF1 API error: ${response.statusText}`);
    }
    const data: OpenF1Driver[] = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to fetch drivers for session ${sessionKey} from OpenF1:`, error);
    return [];
  }
}

/**
 * Get latest drivers from the most recent session
 */
export async function getLatestDrivers(): Promise<OpenF1Driver[]> {
  try {
    const latestSession = await getLatestSession();
    if (!latestSession) {
      return [];
    }

    return await getDriversBySession(latestSession.session_key);
  } catch (error) {
    console.error('Failed to fetch latest drivers from OpenF1:', error);
    return [];
  }
}
