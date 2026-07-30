#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
//  Mind Wallet — E2E Test Runner
//  Usage: node server/tests/index.test.js
//  Requires: docker-compose up (API + PostgreSQL running)
// ═══════════════════════════════════════════════════════════════

import { BASE_URL, TEST_USER, colors, api, printSummary } from './helpers.js';
import { testAuth } from './auth.test.js';
import { testTransactions } from './transactions.test.js';
import { testGoals } from './goals.test.js';
import { testDashboard } from './dashboard.test.js';
import { testRecurring } from './recurring.test.js';
import { testPledges } from './pledges.test.js';
import { testEngineChat } from './engine-chat.test.js';
import { testEngineAction } from './engine-action.test.js';
import { testCleanup } from './cleanup.test.js';

const run = async () => {
    console.log(`\n${colors.magenta}${colors.bright}╔══════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.magenta}${colors.bright}║     Mind Wallet — E2E Test Suite                 ║${colors.reset}`);
    console.log(`${colors.magenta}${colors.bright}╚══════════════════════════════════════════════════╝${colors.reset}`);
    console.log(`${colors.dim}  Target API : ${BASE_URL}`);
    console.log(`  Test Agent : ${TEST_USER.email}`);
    console.log(`  Timestamp  : ${new Date().toLocaleString('tr-TR')}${colors.reset}\n`);

    // ── Health check ──
    try {
        const health = await api('GET', '/health');
        if (health.status !== 200) {
            console.error(`${colors.red}✖ API server is not responding properly (status: ${health.status}).${colors.reset}`);
            process.exit(1);
        }
        console.log(`${colors.green}✔${colors.reset} ${colors.dim}API health check passed${colors.reset}\n`);
    } catch (error) {
        console.error(`${colors.red}✖ Failed to connect to API server:${colors.reset}`, error.message);
        console.error(`${colors.yellow}  Make sure docker-compose is running: docker-compose up${colors.reset}`);
        process.exit(1);
    }

    // ── Run all test modules sequentially ──
    try {
        await testAuth();
        await testTransactions();
        await testGoals();
        await testDashboard();
        await testRecurring();
        await testPledges();
        await testEngineChat();
        await testEngineAction();
        await testCleanup();
    } catch (error) {
        console.error(`\n${colors.red}${colors.bright}✖ Critical Test Failure:${colors.reset}`, error.message);
        console.error(error.stack);
    }

    printSummary();
    process.exit(0);
};

run();
