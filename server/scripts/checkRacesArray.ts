
import f1Data from '../../client/src/f1_data.json';

const races = f1Data.races || [];
const qatar = races.find(r => r.round === 23);

if (qatar) {
    console.log('Found Qatar in races array:');
    console.log('Name:', qatar.name);
    console.log('Sessions:', qatar.sessions ? qatar.sessions.length : 0);
    if (qatar.sessions) {
        console.log(JSON.stringify(qatar.sessions, null, 2));
    }
} else {
    console.log('Qatar not found in races array.');
}

const racesByYear = f1Data.races_by_year || {};
const races2025 = racesByYear['2025'] || [];
const qatar2025 = races2025.find(r => r.round === 23);

if (qatar2025) {
    console.log('\nFound Qatar in races_by_year[2025]:');
    console.log('Name:', qatar2025.name);
    console.log('Sessions:', qatar2025.sessions ? qatar2025.sessions.length : 0);
} else {
    console.log('\nQatar not found in races_by_year[2025].');
}
