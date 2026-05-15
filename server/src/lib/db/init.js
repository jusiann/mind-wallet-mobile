import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const initDB = async () => {
    const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    try {
        const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
        await db.query(schema);
        console.log(`[DB - ${time}] Schema initialized successfully`);

        const seed = readFileSync(join(__dirname, 'seed.sql'), 'utf8');
        await db.query(seed);
        console.log(`[DB - ${time}] Seed data loaded successfully`);
    } catch (error) {
        console.error(`[DB - ${time}] DB initialization failed: ${error.message}`);
        process.exit(1);
    }
};
