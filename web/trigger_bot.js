
const fetch = require('node-fetch'); // Native fetch in Node 18+ but generic script
// Using dynamic import or native fetch if available
// Node 18+ has fetch built-in.
async function trigger() {
    try {
        console.log('Triggering Bot...');
        // Wait for server to start
        await new Promise(r => setTimeout(r, 5000));

        const res = await fetch('http://localhost:3000/api/bot/run', {
            method: 'POST'
        });
        const json = await res.json();
        console.log('Result:', JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}
trigger();
