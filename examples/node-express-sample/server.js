// Sample Express Server
const port = process.env.PORT || 8080;
const secret = process.env.SESSION_SECRET || 'dev_secret';
const database = process.env.DATABASE_URL || 'sqlite://memory';

console.log(`[Sample App] Booting on port ${port} with DB ${database}...`);
console.log('[Sample App] Ready for incoming requests.');
