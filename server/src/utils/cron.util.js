import cron from 'cron';
import http from 'http';
import https from 'https';
import db from '../lib/db/database.js';

const pingJob = new cron.CronJob("*/10 * * * *", function () {
    const url = process.env.PROXY_URL;
    if (!url) {
        return;
    }

    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    
    client
        .get(url, (res) => {
            if(res.statusCode === 200)
                console.log(`[CRON - ${time}] Ping successful: ${res.statusCode}`);
            else
                console.log(`[CRON - ${time}] Ping failed: ${res.statusCode}`);
        }).on('error', (e) => {
            console.error(`[CRON - ${time}] Ping error:`, e.message);
        });
});

const recurringJob = new cron.CronJob("0 0 * * *", async function () {
    const time = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    try {
        await db.query('BEGIN');
        
        const result = await db.query(
            `SELECT * FROM recurring_transactions 
             WHERE is_active = true AND next_run_date <= CURRENT_DATE`
        );
        
        for (const rt of result.rows) {
            const origDate = new Date(rt.next_run_date);
            const origDateStr = `${origDate.getFullYear()}-${String(origDate.getMonth() + 1).padStart(2, '0')}-${String(origDate.getDate()).padStart(2, '0')} 00:00:00`;

            await db.query(
                `INSERT INTO transactions (user_id, category_id, amount, type, description, transaction_timestamp)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [rt.user_id, rt.category_id, rt.amount, rt.type, rt.description, origDateStr]
            );
            
            let nextRun = new Date(rt.next_run_date);
            if (rt.interval === 'DAILY') {
                nextRun.setDate(nextRun.getDate() + 1);
            } else if (rt.interval === 'WEEKLY') {
                nextRun.setDate(nextRun.getDate() + 7);
            } else if (rt.interval === 'MONTHLY') {
                nextRun.setMonth(nextRun.getMonth() + 1);
            } else if (rt.interval === 'YEARLY') {
                nextRun.setFullYear(nextRun.getFullYear() + 1);
            }
            
            const nextRunStr = `${nextRun.getFullYear()}-${String(nextRun.getMonth() + 1).padStart(2, '0')}-${String(nextRun.getDate()).padStart(2, '0')}`;

            await db.query(
                `UPDATE recurring_transactions SET next_run_date = $1 WHERE id = $2`,
                [nextRunStr, rt.id]
            );
        }
        
        await db.query('COMMIT');
        if (result.rows.length > 0) {
            console.log(`[CRON - ${time}] Processed ${result.rows.length} recurring transactions.`);
        }
    } catch (e) {
        await db.query('ROLLBACK');
        console.error(`[CRON - ${time}] Recurring job error:`, e);
    }
});

export default {
    start: () => {
        pingJob.start();
        recurringJob.start();
    }
};
