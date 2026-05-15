import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const db = new Pool({
    max: parseInt(process.env.DB_POOL_MAX || '30'),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '10000'),
    connectionTimeoutMillis: parseInt(process.env.DB_POOL_TIMEOUT || '5000'),
    maxUses: parseInt(process.env.DB_POOL_MAX_USES || '500'),
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const connectDB = async (retries = 5, delay = 5000) => {
    while (retries > 0) {
        const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
        try {
            await db.query('SELECT 1');
            console.log(`[DB - ${time}] PostgreSQL connected`);
            return;
        } catch (error) {
            console.error(`[DB - ${time}] PostgreSQL connection failed. Retries left: ${retries - 1}. Error: ${error.message}`);
            retries -= 1;
            if (retries === 0) {
                console.error(`[DB - ${time}] Could not connect to PostgreSQL. Exiting...`);
                process.exit(1);
            }
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

export default db;
