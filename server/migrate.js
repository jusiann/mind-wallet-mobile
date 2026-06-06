import db from './src/lib/db/database.js';

async function run() {
    try {
        await db.query("ALTER TABLE recurring_transactions ADD COLUMN \"interval\" VARCHAR(20) DEFAULT 'MONTHLY'");
        console.log('interval added');
    } catch(e) { console.log('interval:', e.message); }

    try {
        await db.query("ALTER TABLE recurring_transactions ADD COLUMN start_date DATE");
        console.log('start_date added');
    } catch(e) { console.log('start_date:', e.message); }

    try {
        await db.query("ALTER TABLE recurring_transactions ADD COLUMN next_run_date DATE");
        console.log('next_run_date added');
    } catch(e) { console.log('next_run_date:', e.message); }

    try {
        await db.query("ALTER TABLE recurring_transactions ADD COLUMN is_active BOOLEAN DEFAULT TRUE");
        console.log('is_active added');
    } catch(e) { console.log('is_active:', e.message); }

    process.exit(0);
}

run();
