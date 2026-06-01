import cron from 'cron';
import http from 'http';
import https from 'https';

const job = new cron.CronJob("*/10 * * * *", function () {
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

export default job;
