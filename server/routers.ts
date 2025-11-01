import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getSeasonRaces, getSeasonDriverStandings, getSeasonConstructorStandings, getRaceResults } from "./services/ergastService";

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
    // Get season races
    getSeasonRaces: publicProcedure
      .input(z.object({ season: z.number() }))
      .query(async ({ input }) => {
        const races = await getSeasonRaces(input.season);
        return races;
      }),

    // Get driver standings for a season
    getDriverStandings: publicProcedure
      .input(z.object({ season: z.number() }))
      .query(async ({ input }) => {
        const standings = await getSeasonDriverStandings(input.season);
        return standings;
      }),

    // Get constructor standings for a season
    getConstructorStandings: publicProcedure
      .input(z.object({ season: z.number() }))
      .query(async ({ input }) => {
        const standings = await getSeasonConstructorStandings(input.season);
        return standings;
      }),

    // Get race results
    getRaceResults: publicProcedure
      .input(z.object({ season: z.number(), round: z.number() }))
      .query(async ({ input }) => {
        const results = await getRaceResults(input.season, input.round);
        return results;
      }),

    // Get multiple seasons data (for historical data)
    getMultipleSeasons: publicProcedure
      .input(z.object({ startSeason: z.number(), endSeason: z.number() }))
      .query(async ({ input }) => {
        const seasons = [];
        for (let season = input.startSeason; season <= input.endSeason; season++) {
          const races = await getSeasonRaces(season);
          seasons.push({
            season,
            races,
            count: races.length,
          });
        }
        return seasons;
      }),
  }),
});

export type AppRouter = typeof appRouter;
