// ═══════════════════════════════════════════════════════════════
//  Test Helpers — shared utilities for all test modules
// ═══════════════════════════════════════════════════════════════

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

const TEST_USER = {
    fullname: `E2E Test User`,
    email: `e2e_test_${Date.now()}@mindwallet.com`,
    password: 'TestPass123!',
};

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    bgGreen: '\x1b[42m',
    bgRed: '\x1b[41m',
};

// ── Shared mutable state across test modules ──
const state = {
    accessToken: '',
    refreshToken: '',
    userId: '',
    categoryId: null,
    categoryName: '',
    transactionIds: [],
    goalIds: [],
    recurringIds: [],
    pledgeId: null,
};

let passed = 0;
let failed = 0;
let total = 0;
const failedTests = [];

const assert = (condition, message) => {
    total++;
    if (condition) {
        passed++;
        console.log(`  ${colors.green}✔${colors.reset} ${colors.dim}${message}${colors.reset}`);
    } else {
        failed++;
        failedTests.push(message);
        console.log(`  ${colors.red}✖${colors.reset} ${colors.bright}${colors.red}${message}${colors.reset}`);
    }
};

const api = async (method, path, body = null, token = null, raw = false) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, options);

    if (raw) return res;

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await res.json();
        return { status: res.status, ...data };
    }

    return { status: res.status, buffer: await res.arrayBuffer() };
};

const section = (title) => {
    console.log(`\n${colors.cyan}▶ ${title}${colors.reset}`);
    console.log(`${colors.dim}──────────────────────────────────────────────────${colors.reset}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const printSummary = () => {
    console.log(`\n${colors.magenta}──────────────────────────────────────────────────${colors.reset}`);
    console.log(`${colors.bright}  TEST EXECUTION SUMMARY${colors.reset}`);
    console.log(`${colors.magenta}──────────────────────────────────────────────────${colors.reset}`);
    console.log(`  Total Tests : ${colors.bright}${total}${colors.reset}`);
    console.log(`  Passed      : ${colors.green}${passed}${colors.reset}`);
    console.log(`  Failed      : ${failed > 0 ? colors.red + failed : colors.dim + failed}${colors.reset}`);

    if (failedTests.length > 0) {
        console.log(`\n${colors.red}  Failed Tests:${colors.reset}`);
        failedTests.forEach((t) => console.log(`    ${colors.red}✖ ${t}${colors.reset}`));
    }
    console.log('');
};

export { BASE_URL, TEST_USER, colors, state, assert, api, section, sleep, printSummary, passed, failed, total };
