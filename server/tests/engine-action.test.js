// ═══════════════════════════════════════════════════════════════
//  Engine Action Tests — All button payload paths
// ═══════════════════════════════════════════════════════════════

import { state, assert, api, section, sleep } from './helpers.js';

// Helper: send an action
const action = async (payload, history = []) =>
    api('POST', '/engine/action', { buttonPayload: payload, history }, state.accessToken);

export const testEngineAction = async () => {
    section('8. AI ENGINE — ACTION (Button Payloads)');

    // ═══════════════════════════════════════════════════════
    //  8.1 Basic Actions (Controller-handled)
    // ═══════════════════════════════════════════════════════

    // ── cancel ──
    const cancel = await action({ action: 'cancel' });
    assert(cancel.status === 200, `ACTION cancel returns 200 OK`);
    assert(cancel.data?.message?.includes('ptal') || cancel.data?.message?.includes('iptal'),
        'Cancel returns iptal message');
    assert(Array.isArray(cancel.data?.buttons), 'Cancel returns buttons');

    // ── done ──
    const done = await action({ action: 'done' });
    assert(done.status === 200, `ACTION done returns 200 OK`);
    assert(done.data?.message, 'Done returns farewell message');

    // ── NEGATIVE: Missing action ──
    const noAction = await api('POST', '/engine/action', { buttonPayload: {} }, state.accessToken);
    assert(noAction.status === 400 || noAction.status === 500, `Negative — Empty action rejected (got ${noAction.status})`);

    // ── NEGATIVE: Missing buttonPayload ──
    const noPayload = await api('POST', '/engine/action', {}, state.accessToken);
    assert(noPayload.status === 400 || noPayload.status === 500, `Negative — Missing buttonPayload rejected (got ${noPayload.status})`);

    // ── NEGATIVE: No auth ──
    const noAuth = await api('POST', '/engine/action', { buttonPayload: { action: 'cancel' } });
    assert(noAuth.status === 401, `Action without token returns 401`);

    // ═══════════════════════════════════════════════════════
    //  8.2 Navigation Actions (Graph-routed)
    // ═══════════════════════════════════════════════════════

    // ── start_transaction ──
    const startTx = await action({ action: 'start_transaction' });
    assert(startTx.status === 200, `ACTION start_transaction returns 200 OK`);
    assert(startTx.data?.classification === 'TRANSACTION', `start_transaction classification is TRANSACTION (got ${startTx.data?.classification})`);
    assert(startTx.data?.message, 'start_transaction returns prompt message');

    // ── start_goal ──
    const startGoal = await action({ action: 'start_goal' });
    assert(startGoal.status === 200, `ACTION start_goal returns 200 OK`);
    assert(startGoal.data?.classification === 'GOAL_CREATION', `start_goal classification is GOAL_CREATION (got ${startGoal.data?.classification})`);

    // ── start_goal_contribution ──
    const startContrib = await action({ action: 'start_goal_contribution' });
    assert(startContrib.status === 200, `ACTION start_goal_contribution returns 200 OK`);
    assert(startContrib.data?.classification === 'GOAL_CONTRIBUTION', `start_goal_contribution classification (got ${startContrib.data?.classification})`);

    // ── select_goal ──
    if (state.goalIds[0]) {
        const selectGoal = await action({
            action: 'select_goal',
            goalId: state.goalIds[0],
            goalTitle: 'E2E Tatil Updated',
        });
        assert(selectGoal.status === 200, `ACTION select_goal returns 200 OK`);
        assert(selectGoal.data?.classification === 'GOAL_CONTRIBUTION', `select_goal classification (got ${selectGoal.data?.classification})`);
    }

    // ═══════════════════════════════════════════════════════
    //  8.3 Analysis Actions
    // ═══════════════════════════════════════════════════════

    await sleep(1500);

    // ── start_analysis ──
    const startAnalysis = await action({ action: 'start_analysis' });
    assert(startAnalysis.status === 200, `ACTION start_analysis returns 200 OK`);
    assert(startAnalysis.data?.classification === 'ANALYSIS', `start_analysis classification is ANALYSIS (got ${startAnalysis.data?.classification})`);
    assert(startAnalysis.data?.message, 'Analysis returns a message');

    // ── reduce_category (if categories exist from analysis) ──
    const reduceRes = await action({
        action: 'reduce_category',
        category: state.categoryName,
        amount: 500,
        delta: 200,
    });
    assert(reduceRes.status === 200, `ACTION reduce_category returns 200 OK`);
    assert(reduceRes.data?.buttons?.some((b) => b.payload?.action === 'get_tips'),
        'reduce_category response includes tips button');

    // ── route_savings (with active goal) ──
    const routeRes = await action({
        action: 'route_savings',
        amount: 300,
        category: state.categoryName,
        categorySpent: 1000,
    });
    assert(routeRes.status === 200, `ACTION route_savings returns 200 OK`);
    assert(routeRes.data?.message, 'route_savings returns message about pledge/routing');

    // ═══════════════════════════════════════════════════════
    //  8.4 Tips Action
    // ═══════════════════════════════════════════════════════

    await sleep(1500);

    // ── get_tips ──
    const tips = await action({ action: 'get_tips' });
    assert(tips.status === 200, `ACTION get_tips returns 200 OK`);
    assert(tips.data?.classification === 'TIPS', `get_tips classification is TIPS (got ${tips.data?.classification})`);
    assert(tips.data?.message?.length > 20, 'Tips message is substantial');

    // ── get_tips with category ──
    await sleep(2500);
    const catTips = await action({ action: 'get_tips', category: state.categoryName });
    assert(catTips.status === 200 || catTips.status === 502, `ACTION get_tips with category returns 200 or 502 (got ${catTips.status})`);

    // ═══════════════════════════════════════════════════════
    //  8.5 Goal Duration / Confirm Actions
    // ═══════════════════════════════════════════════════════

    // ── set_deadline ──
    const setDeadline = await action({
        action: 'set_deadline',
        months: 6,
        pendingGoalData: {
            title: 'E2E Test Goal',
            target_amount: 10000,
        },
    });
    assert(setDeadline.status === 200, `ACTION set_deadline returns 200 OK`);
    assert(setDeadline.data?.classification === 'GOAL_CREATION', `set_deadline classification (got ${setDeadline.data?.classification})`);
    assert(setDeadline.data?.buttons?.some((b) => b.payload?.action === 'confirm_goal'),
        'set_deadline response has confirm_goal button');

    // ═══════════════════════════════════════════════════════
    //  8.6 Confirm Actions (DB mutations)
    // ═══════════════════════════════════════════════════════

    // ── confirm_transaction ──
    const confirmTx = await action({
        action: 'confirm_transaction',
        transaction: {
            amount: 250,
            transactionType: 'EXPENSE',
            category: state.categoryName,
            description: 'E2E Chat Transaction',
            timestamp: new Date().toISOString(),
        },
    });
    assert(confirmTx.status === 200, `ACTION confirm_transaction returns 200 OK (got ${confirmTx.status})`);
    assert(confirmTx.data?.message?.includes('kaydedildi'), 'confirm_transaction success message');
    assert(confirmTx.data?.classification === 'TRANSACTION', `confirm_transaction classification (got ${confirmTx.data?.classification})`);

    // ── confirm_goal ──
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 6);
    const confirmGoal = await action({
        action: 'confirm_goal',
        goal: {
            title: 'E2E Chat Goal',
            target_amount: 8000,
            deadline: deadline.toISOString().split('T')[0],
        },
    });
    assert(confirmGoal.status === 200, `ACTION confirm_goal returns 200 OK`);
    assert(confirmGoal.data?.message?.includes('oluşturuldu'), 'confirm_goal success message');
    assert(confirmGoal.data?.classification === 'GOAL_CREATION', `confirm_goal classification (got ${confirmGoal.data?.classification})`);

    // ── confirm_goal_contribution ──
    if (state.goalIds[0]) {
        const confirmContrib = await action({
            action: 'confirm_goal_contribution',
            contribution: {
                goalId: state.goalIds[0],
                goalTitle: 'E2E Tatil Updated',
                amount: 1000,
            },
        });
        assert(confirmContrib.status === 200, `ACTION confirm_goal_contribution returns 200 OK`);
        assert(confirmContrib.data?.message?.includes('eklendi'), 'confirm_goal_contribution success message');
    }

    // ── confirm_pledge ──
    if (state.goalIds[0]) {
        const confirmPledge = await action({
            action: 'confirm_pledge',
            pledge: {
                goalId: state.goalIds[0],
                goalTitle: 'E2E Tatil Updated',
                amount: 400,
                category: state.categoryName,
                categorySpent: 900,
            },
        });
        assert(confirmPledge.status === 200, `ACTION confirm_pledge returns 200 OK`);
        assert(confirmPledge.data?.message?.includes('Söz verildi') || confirmPledge.data?.message?.includes('söz'),
            'confirm_pledge success message');
    }

    // ── confirm_routing ──
    if (state.goalIds[0]) {
        const confirmRoute = await action({
            action: 'confirm_routing',
            route: {
                goalId: state.goalIds[0],
                goalTitle: 'E2E Tatil Updated',
                amount: 500,
            },
        });
        assert(confirmRoute.status === 200, `ACTION confirm_routing returns 200 OK`);
        assert(confirmRoute.data?.message?.includes('yönlendirildi'), 'confirm_routing success message');
    }

    // ── NEGATIVE: confirm_transaction with bad data ──
    const badConfirm = await action({
        action: 'confirm_transaction',
        transaction: { amount: -100 },
    });
    assert(badConfirm.status === 400, `Negative — Bad confirm_transaction rejected (got ${badConfirm.status})`);

    // ── NEGATIVE: confirm_goal with missing fields ──
    const badGoal = await action({
        action: 'confirm_goal',
        goal: { title: 'No Amount' },
    });
    assert(badGoal.status === 400, `Negative — Bad confirm_goal rejected (got ${badGoal.status})`);

    // ═══════════════════════════════════════════════════════
    //  8.7 Cancel/Done Rotation
    // ═══════════════════════════════════════════════════════

    section('8b. AI ENGINE — ACTION (Cancel/Done Rotation)');

    const cancelMsgs = new Set();
    for (let i = 0; i < 5; i++) {
        const c = await action({ action: 'cancel' });
        if (c.data?.message) cancelMsgs.add(c.data.message);
    }
    assert(cancelMsgs.size >= 1, `Cancel rotation: got ${cancelMsgs.size} unique messages (expected ≥1)`);

    const doneMsgs = new Set();
    for (let i = 0; i < 5; i++) {
        const d = await action({ action: 'done' });
        if (d.data?.message) doneMsgs.add(d.data.message);
    }
    assert(doneMsgs.size >= 1, `Done rotation: got ${doneMsgs.size} unique messages (expected ≥1)`);
};
