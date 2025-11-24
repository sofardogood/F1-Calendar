
import { scrapeRaceDetails } from '../services/wikipediaScraper.js';

async function main() {
    const url = 'https://ja.wikipedia.org/wiki/%E3%82%AB%E3%82%BF%E3%83%BC%E3%83%AB%E3%82%B0%E3%83%A9%E3%83%B3%E3%83%97%E3%83%AA_(4%E8%BC%AA)';
    console.log(`Testing scrapeRaceDetails for: ${url}`);

    try {
        const sessions = await scrapeRaceDetails(url, 2025);
        console.log('Sessions found:', sessions.length);
        console.log(JSON.stringify(sessions, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
