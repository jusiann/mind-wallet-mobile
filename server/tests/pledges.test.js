// ═══════════════════════════════════════════════════════════════
//  Pledge Tests — List, Resolve, Cancel, Negatives
// ═══════════════════════════════════════════════════════════════

import { state, assert, api, section, sleep } from './helpers.js';

export const testPledges = async () => {
    section('6. SAVINGS PLEDGES');

    // ── Create a pledge via engine action (confirm_pledge) ──
    // This simulates the full AI flow where analysis → route_savings → confirm_pledge
    const pledgeRes = await api('POST', '/engine/action', {
        buttonPayload: {
            action: 'confirm_pledge',
            pledge: {
                goalId: state.goalIds[0],
                goalTitle: 'E2E Tatil Updated',
                amount: 500,
                category: state.categoryName,
                categorySpent: 1000,
            },
        },
    }, state.accessToken);
    assert(pledgeRes.status === 200, `Create pledge via engine action returns 200 (got ${pledgeRes.status})`);
    assert(pledgeRes.data?.message?.includes('Söz verildi') || pledgeRes.success, 'Pledge confirmation message returned');

    // Wait a bit for DB
    await sleep(300);

    // ── List pledges ──
    const allPledges = await api('GET', '/pledges', null, state.accessToken);
    assert(allPledges.status === 200, `GET /pledges returns 200 OK`);
    assert(Array.isArray(allPledges.data), 'Pledges data is array');

    if (allPledges.data?.length > 0) {
        state.pledgeId = allPledges.data[0].id;
        assert(allPledges.data[0].status === 'PENDING', 'First pledge status is PENDING');
        assert(allPledges.data[0].goal_title, 'Pledge has goal_title');
    }

    // ── List with status filter ──
    const pending = await api('GET', '/pledges?status=PENDING', null, state.accessToken);
    assert(pending.status === 200, `Filter status=PENDING returns 200 OK`);

    // ── NEGATIVE: Invalid pledge ID ──
    const badId = await api('POST', '/pledges/abc/resolve', null, state.accessToken);
    assert(badId.status === 400, `Negative — Invalid pledge ID rejected (got ${badId.status})`);

    // ── NEGATIVE: Nonexistent pledge ──
    const noPledge = await api('POST', '/pledges/999999/cancel', null, state.accessToken);
    assert(noPledge.status === 404, `Negative — Nonexistent pledge returns 404 (got ${noPledge.status})`);

    // ── Cancel pledge ──
    if (state.pledgeId) {
        const canceled = await api('POST', `/pledges/${state.pledgeId}/cancel`, null, state.accessToken);
        assert(canceled.status === 200, `Cancel pledge returns 200 OK`);
        assert(canceled.data?.message?.includes('iptal') || canceled.success, 'Cancel confirmation returned');

        // ── NEGATIVE: Cancel already canceled ──
        const reCancel = await api('POST', `/pledges/${state.pledgeId}/cancel`, null, state.accessToken);
        assert(reCancel.status === 404, `Negative — Re-cancel returns 404 (got ${reCancel.status})`);
    }

    // ── Create another pledge for resolve test ──
    const pledge2 = await api('POST', '/engine/action', {
        buttonPayload: {
            action: 'confirm_pledge',
            pledge: {
                goalId: state.goalIds[0],
                goalTitle: 'E2E Tatil Updated',
                amount: 200,
                category: state.categoryName,
                categorySpent: 800,
            },
        },
    }, state.accessToken);
    assert(pledge2.status === 200, `Create second pledge returns 200`);

    await sleep(300);

    // ── Resolve pledge ──
    const pledges2 = await api('GET', '/pledges?status=PENDING', null, state.accessToken);
    if (pledges2.data?.length > 0) {
        const pid = pledges2.data[0].id;
        const resolved = await api('POST', `/pledges/${pid}/resolve`, null, state.accessToken);
        assert(resolved.status === 200, `Resolve pledge returns 200 OK`);
        assert(resolved.data?.resolved !== undefined, 'Resolve result has resolved boolean');
    }
};
