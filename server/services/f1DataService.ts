/**
 * Unified F1 Data Service
 * Combines Ergast API (historical data) and OpenF1 API (latest data)
 * with intelligent caching
 */

import { getSeasonRaces, getSeasonDriverStandings, getSeasonConstructorStandings, getRaceResults } from './ergastService';
import { getMeetingsByYear, getSessionsByYear, getLatestDrivers } from './openF1Service';
import { cacheService } from './cacheService';

const CURRENT_YEAR = new Date().getFullYear();
const CACHE_TTL_MINUTES = 5;
const CACHE_TTL_HOURS = 24;

/**
 * Get races for a specific season with caching
 * Uses Ergast for historical data (<=2024) and OpenF1 for current/future seasons
 */
export async function getLatestSeasonRaces(season: number) {
  const cacheKey = `races:${season}`;

  // Check cache first
  const cached = cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  let data;

  // Use Ergast for historical data (2005-2024)
  if (season <= 2024) {
    data = await getSeasonRaces(season);
    // Cache historical data for longer (24 hours)
    cacheService.set(cacheKey, data, CACHE_TTL_HOURS * 60 * 60 * 1000);
  } else {
    // Use OpenF1 for current and future seasons
    const meetings = await getMeetingsByYear(season);
    const sessions = await getSessionsByYear(season);

    // Transform OpenF1 data to match Ergast format
    data = meetings.map((meeting) => {
      const meetingSessions = sessions.filter(
        (s) => s.meeting_key === meeting.meeting_key
      );

      return {
        season: String(season),
        round: String(meeting.meeting_key),
        raceName: meeting.meeting_name,
        date: meeting.date_start,
        Circuit: {
          circuitName: meeting.circuit_short_name,
          Location: {
            locality: meeting.location,
            country: meeting.country_name,
          },
        },
        sessions: meetingSessions,
      };
    });

    // Cache current season data for shorter time (5 minutes)
    cacheService.set(cacheKey, data, CACHE_TTL_MINUTES * 60 * 1000);
  }

  return data;
}

/**
 * Get driver standings with caching
 */
export async function getLatestDriverStandings(season: number) {
  const cacheKey = `driver-standings:${season}`;

  const cached = cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  // For current season, use shorter cache
  const ttl = season === CURRENT_YEAR
    ? CACHE_TTL_MINUTES * 60 * 1000
    : CACHE_TTL_HOURS * 60 * 60 * 1000;

  const data = await getSeasonDriverStandings(season);
  cacheService.set(cacheKey, data, ttl);

  return data;
}

/**
 * Get constructor standings with caching
 */
export async function getLatestConstructorStandings(season: number) {
  const cacheKey = `constructor-standings:${season}`;

  const cached = cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  const ttl = season === CURRENT_YEAR
    ? CACHE_TTL_MINUTES * 60 * 1000
    : CACHE_TTL_HOURS * 60 * 60 * 1000;

  const data = await getSeasonConstructorStandings(season);
  cacheService.set(cacheKey, data, ttl);

  return data;
}

/**
 * Get race results with caching
 */
export async function getLatestRaceResults(season: number, round: number) {
  const cacheKey = `race-results:${season}:${round}`;

  const cached = cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await getRaceResults(season, round);

  // Cache completed race results for longer (24 hours)
  cacheService.set(cacheKey, data, CACHE_TTL_HOURS * 60 * 60 * 1000);

  return data;
}

/**
 * Get latest drivers from OpenF1
 */
export async function getLatestF1Drivers() {
  const cacheKey = 'latest-drivers';

  const cached = cacheService.get(cacheKey);
  if (cached) {
    return cached;
  }

  const data = await getLatestDrivers();

  // Cache for 1 hour
  cacheService.set(cacheKey, data, 60 * 60 * 1000);

  return data;
}

/**
 * Force refresh cache for a specific season
 */
export function refreshSeasonCache(season: number) {
  cacheService.delete(`races:${season}`);
  cacheService.delete(`driver-standings:${season}`);
  cacheService.delete(`constructor-standings:${season}`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cacheService.getStats();
}
