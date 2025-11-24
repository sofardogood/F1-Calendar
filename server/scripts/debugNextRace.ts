
import f1Data from '../../client/src/f1_data.json';

const data = f1Data;
const currentSeasonRaces = data.races || [];

const getNextRace = () => {
    const now = new Date(); // This will use system time, which is 2025-11-24
    console.log('Current date:', now.toISOString());

    for (const race of currentSeasonRaces) {
        const raceDate = new Date(race.date_end);
        // Set raceDate to end of day to be inclusive?
        // The original code uses new Date(race.date_end) which defaults to 00:00:00 UTC (or local)
        // If date_end is "2025-11-30", new Date("2025-11-30") is 2025-11-30T00:00:00.000Z

        if (raceDate >= now) {
            return race;
        }
    }
    return currentSeasonRaces[0];
};

const nextRace = getNextRace();
console.log('Next Race:', nextRace.name);
console.log('Sessions:', JSON.stringify(nextRace.sessions, null, 2));
