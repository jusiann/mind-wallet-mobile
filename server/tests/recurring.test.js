// ═══════════════════════════════════════════════════════════════
//  Recurring Transaction Tests — CRUD, Toggle, Negatives
// ═══════════════════════════════════════════════════════════════

import { state, assert, api, section } from './helpers.js';

export const testRecurring = async () => {
    section('5. RECURRING TRANSACTIONS');

    // ── NEGATIVE: Missing fields ──
    const bad = await api('POST', '/recurring', { description: 'No amount' }, state.accessToken);
    assert(bad.status === 400, `Negative — Missing fields rejected (got ${bad.status})`);

    // ── Create MONTHLY recurring ──
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const startDate = futureDate.toISOString().split('T')[0];

    const monthly = await api('POST', '/recurring', {
        amount: 500,
        type: 'EXPENSE',
        category_id: state.categoryId,
        description: 'E2E Aylık Aidat',
        interval: 'MONTHLY',
        start_date: startDate,
    }, state.accessToken);
    assert(monthly.status === 201, `Create MONTHLY recurring returns 201 (got ${monthly.status})`);
    if (monthly.data?.id) state.recurringIds.push(monthly.data.id);

    // ── Create WEEKLY recurring ──
    const weekly = await api('POST', '/recurring', {
        amount: 100,
        type: 'EXPENSE',
        description: 'E2E Haftalık Market',
        interval: 'WEEKLY',
        start_date: startDate,
    }, state.accessToken);
    assert(weekly.status === 201, `Create WEEKLY recurring returns 201`);
    if (weekly.data?.id) state.recurringIds.push(weekly.data.id);

    // ── List ──
    const all = await api('GET', '/recurring', null, state.accessToken);
    assert(all.status === 200, `GET /recurring returns 200 OK`);
    assert(all.data?.length >= 2, `At least 2 recurring transactions listed (got ${all.data?.length})`);

    // ── Toggle (deactivate) ──
    const toggled = await api('PATCH', `/recurring/${state.recurringIds[0]}/toggle`, {
        is_active: false,
    }, state.accessToken);
    assert(toggled.status === 200, `Toggle deactivate returns 200 OK`);
    assert(toggled.data?.is_active === false, 'Recurring is now inactive');

    // ── Toggle (reactivate) ──
    const reactivated = await api('PATCH', `/recurring/${state.recurringIds[0]}/toggle`, {
        is_active: true,
    }, state.accessToken);
    assert(reactivated.status === 200, `Toggle reactivate returns 200 OK`);
    assert(reactivated.data?.is_active === true, 'Recurring is now active again');

    // ── NEGATIVE: Toggle missing is_active ──
    const badToggle = await api('PATCH', `/recurring/${state.recurringIds[0]}/toggle`, {}, state.accessToken);
    assert(badToggle.status === 400, `Negative — Toggle without is_active rejected (got ${badToggle.status})`);

    // ── NEGATIVE: Toggle nonexistent ──
    const noRec = await api('PATCH', '/recurring/999999/toggle', { is_active: false }, state.accessToken);
    assert(noRec.status === 404, `Negative — Nonexistent recurring toggle returns 404 (got ${noRec.status})`);

    // ── Delete one ──
    const delId = state.recurringIds.pop();
    const deleted = await api('DELETE', `/recurring/${delId}`, null, state.accessToken);
    assert(deleted.status === 200, `Delete recurring returns 200 OK`);

    // ── NEGATIVE: Delete already deleted ──
    const reDel = await api('DELETE', `/recurring/${delId}`, null, state.accessToken);
    assert(reDel.status === 404, `Negative — Re-delete returns 404 (got ${reDel.status})`);
};
