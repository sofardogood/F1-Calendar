import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getSeasonRaces, getSeasonDriverStandings, getSeasonConstructorStandings, getRaceResults } from "./services/ergastService";
import {
  getLatestSeasonRaces,
  getLatestDriverStandings,
  getLatestConstructorStandings,
  getLatestRaceResults,
  getLatestF1Drivers,
  refreshSeasonCache,
  getCacheStats,
} from "./services/f1DataService";
import { getLatestSession } from "./services/openF1Service";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // F1 Data API
  f1: router({
    // Get season races (with automatic latest data and caching)
    getSeasonRaces: publicProcedure
      .input(z.object({ season: z.number() }))
      .query(async ({ input }) => {
        const races = await getLatestSeasonRaces(input.season);
        return races;
      }),

    // Get driver standings for a season (with caching)
    getDriverStandings: publicProcedure
      .input(z.object({ season: z.number() }))
      .query(async ({ input }) => {
        const standings = await getLatestDriverStandings(input.season);
        return standings;
      }),

    // Get constructor standings for a season (with caching)
    getConstructorStandings: publicProcedure
      .input(z.object({ season: z.number() }))
      .query(async ({ input }) => {
        const standings = await getLatestConstructorStandings(input.season);
        return standings;
      }),

    // Get race results (with caching)
    getRaceResults: publicProcedure
      .input(z.object({ season: z.number(), round: z.number() }))
      .query(async ({ input }) => {
        const results = await getLatestRaceResults(input.season, input.round);
        return results;
      }),

    // Get multiple seasons data (for historical data)
    getMultipleSeasons: publicProcedure
      .input(z.object({ startSeason: z.number(), endSeason: z.number() }))
      .query(async ({ input }) => {
        const seasons = [];
        for (let season = input.startSeason; season <= input.endSeason; season++) {
          const races = await getLatestSeasonRaces(season);
          seasons.push({
            season,
            races,
            count: races.length,
          });
        }
        return seasons;
      }),

    // NEW: Get latest session (current or upcoming race)
    getLatestSession: publicProcedure.query(async () => {
      const session = await getLatestSession();
      return session;
    }),

    // NEW: Get latest drivers
    getLatestDrivers: publicProcedure.query(async () => {
      const drivers = await getLatestF1Drivers();
      return drivers;
    }),

    // NEW: Force refresh cache for a season
    refreshCache: publicProcedure
      .input(z.object({ season: z.number() }))
      .mutation(async ({ input }) => {
        refreshSeasonCache(input.season);
        return { success: true, message: `Cache refreshed for season ${input.season}` };
      }),

    // NEW: Get cache statistics
    getCacheStats: publicProcedure.query(() => {
      return getCacheStats();
    }),
  }),
});

export type AppRouter = typeof appRouter;
