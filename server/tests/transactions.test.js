// ═══════════════════════════════════════════════════════════════
//  Transaction Tests — CRUD, Categories, Filters, Export, Negatives
// ═══════════════════════════════════════════════════════════════

import { state, assert, api, section } from './helpers.js';

export const testTransactions = async () => {
    section('2. TRANSACTIONS');

    // ── Get categories ──
    const cats = await api('GET', '/transactions/categories');
    assert(cats.status === 200, `GET /categories returns 200 OK`);
    assert(Array.isArray(cats.categories) && cats.categories.length > 0, 'Categories list is not empty');

    // Store a category for later use
    const foodCat = cats.categories?.find((c) => c.name.toLowerCase().includes('food'));
    const anyCat = foodCat || cats.categories?.[0];
    state.categoryId = anyCat?.id;
    state.categoryName = anyCat?.name;

    // ── NEGATIVE: Missing required fields ──
    const badTx = await api('POST', '/transactions', { description: 'Missing amount' }, state.accessToken);
    assert(badTx.status === 400, `Negative — Missing fields rejected (got ${badTx.status})`);

    // ── NEGATIVE: Invalid type ──
    const badType = await api('POST', '/transactions', {
        amount: 100,
        type: 'INVALID_TYPE',
        transaction_timestamp: new Date().toISOString(),
    }, state.accessToken);
    assert(badType.status === 400 || badType.status === 500, `Negative — Invalid type rejected (got ${badType.status})`);

    // ── Create EXPENSE ──
    const expense1 = await api('POST', '/transactions', {
        amount: 150.50,
        type: 'EXPENSE',
        category_id: state.categoryId,
        description: 'E2E Market Alışverişi',
        transaction_timestamp: new Date().toISOString(),
    }, state.accessToken);
    assert(expense1.status === 201, `Create EXPENSE returns 201 (got ${expense1.status})`);
    if (expense1.transaction?.id) state.transactionIds.push(expense1.transaction.id);

    // ── Create another EXPENSE ──
    const expense2 = await api('POST', '/transactions', {
        amount: 85.00,
        type: 'EXPENSE',
        category_id: state.categoryId,
        description: 'E2E Kafe',
        transaction_timestamp: new Date().toISOString(),
    }, state.accessToken);
    assert(expense2.status === 201, `Create second EXPENSE returns 201`);
    if (expense2.transaction?.id) state.transactionIds.push(expense2.transaction.id);

    // ── Create INCOME ──
    const income = await api('POST', '/transactions', {
        amount: 35000,
        type: 'INCOME',
        description: 'E2E Maaş',
        transaction_timestamp: new Date().toISOString(),
    }, state.accessToken);
    assert(income.status === 201, `Create INCOME returns 201`);
    if (income.transaction?.id) state.transactionIds.push(income.transaction.id);

    // ── List all ──
    const all = await api('GET', '/transactions', null, state.accessToken);
    assert(all.status === 200, `GET /transactions returns 200 OK`);
    assert(all.transactions?.length >= 3, `At least 3 transactions listed (got ${all.transactions?.length})`);

    // ── Filter by type ──
    const expenses = await api('GET', '/transactions?type=EXPENSE', null, state.accessToken);
    assert(expenses.status === 200, `Filter by type=EXPENSE returns 200 OK`);
    const allExpense = (expenses.transactions ?? []).every((t) => t.type === 'EXPENSE');
    assert(allExpense, 'Filtered results are all EXPENSE');

    // ── Filter by category ──
    const byCat = await api('GET', `/transactions?category_id=${state.categoryId}`, null, state.accessToken);
    assert(byCat.status === 200, `Filter by category_id returns 200 OK`);

    // ── Get single transaction ──
    const single = await api('GET', `/transactions/${state.transactionIds[0]}`, null, state.accessToken);
    assert(single.status === 200, `GET single transaction returns 200 OK`);
    assert(single.transaction?.description === 'E2E Market Alışverişi', 'Single transaction data matches');

    // ── NEGATIVE: Nonexistent transaction ──
    const noTx = await api('GET', '/transactions/999999', null, state.accessToken);
    assert(noTx.status === 404, `Negative — Nonexistent transaction returns 404 (got ${noTx.status})`);

    // ── Update transaction ──
    const updated = await api('PUT', `/transactions/${state.transactionIds[0]}`, {
        amount: 175.00,
        description: 'E2E Market Updated',
    }, state.accessToken);
    assert(updated.status === 200, `Update transaction returns 200 OK (got ${updated.status})`);

    // ── Export XLSX ──
    const exportRes = await api('GET', '/transactions/export', null, state.accessToken, true);
    assert(exportRes.status === 200, `Excel export returns 200 OK`);
    const ct = exportRes.headers.get('content-type') || '';
    assert(ct.includes('spreadsheet') || ct.includes('octet-stream'), `Proper Excel Content-Type received`);
    const buf = await exportRes.arrayBuffer();
    assert(buf.byteLength > 0, `Exported file contains data (${buf.byteLength} bytes)`);

    // ── Delete one transaction ──
    const lastTxId = state.transactionIds.pop();
    const deleted = await api('DELETE', `/transactions/${lastTxId}`, null, state.accessToken);
    assert(deleted.status === 200, `Delete transaction returns 200 OK`);

    // ── NEGATIVE: Delete already deleted ──
    const reDel = await api('DELETE', `/transactions/${lastTxId}`, null, state.accessToken);
    assert(reDel.status === 404, `Negative — Re-delete returns 404 (got ${reDel.status})`);
};
