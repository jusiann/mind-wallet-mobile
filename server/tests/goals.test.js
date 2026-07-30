// ═══════════════════════════════════════════════════════════════
//  Goals Tests — CRUD, Status filter, Contribution, Negatives
// ═══════════════════════════════════════════════════════════════

import { state, assert, api, section } from './helpers.js';

export const testGoals = async () => {
    section('3. GOALS');

    // ── NEGATIVE: Missing required fields ──
    const badGoal = await api('POST', '/goals', { title: 'No Amount' }, state.accessToken);
    assert(badGoal.status === 400, `Negative — Missing fields rejected (got ${badGoal.status})`);

    // ── Create goals ──
    const deadline1 = new Date();
    deadline1.setMonth(deadline1.getMonth() + 6);
    const goal1 = await api('POST', '/goals', {
        title: 'E2E Tatil Fonu',
        target_amount: 15000,
        deadline: deadline1.toISOString().split('T')[0],
    }, state.accessToken);
    assert(goal1.status === 201, `Create goal 1 returns 201 (got ${goal1.status})`);
    if (goal1.goal?.id) state.goalIds.push(goal1.goal.id);

    const deadline2 = new Date();
    deadline2.setFullYear(deadline2.getFullYear() + 1);
    const goal2 = await api('POST', '/goals', {
        title: 'E2E Acil Durum',
        target_amount: 50000,
        deadline: deadline2.toISOString().split('T')[0],
    }, state.accessToken);
    assert(goal2.status === 201, `Create goal 2 returns 201`);
    if (goal2.goal?.id) state.goalIds.push(goal2.goal.id);

    const deadline3 = new Date();
    deadline3.setMonth(deadline3.getMonth() + 3);
    const goal3 = await api('POST', '/goals', {
        title: 'E2E Deletable Goal',
        target_amount: 5000,
        deadline: deadline3.toISOString().split('T')[0],
    }, state.accessToken);
    assert(goal3.status === 201, `Create goal 3 (for deletion) returns 201`);
    if (goal3.goal?.id) state.goalIds.push(goal3.goal.id);

    // ── List all goals ──
    const all = await api('GET', '/goals', null, state.accessToken);
    assert(all.status === 200, `GET /goals returns 200 OK`);
    assert(all.goals?.length >= 3, `At least 3 goals listed (got ${all.goals?.length})`);

    // ── Filter by status ──
    const active = await api('GET', '/goals?status=ACTIVE', null, state.accessToken);
    assert(active.status === 200, `Filter status=ACTIVE returns 200 OK`);
    assert(active.goals?.length >= 3, `All goals are ACTIVE`);

    // ── Get single goal ──
    const single = await api('GET', `/goals/${state.goalIds[0]}`, null, state.accessToken);
    assert(single.status === 200, `GET single goal returns 200 OK`);
    assert(single.goal?.title === 'E2E Tatil Fonu', 'Single goal data matches');
    assert(single.goal?.progress_pct !== undefined, 'Goal has progress_pct field');

    // ── NEGATIVE: Nonexistent goal ──
    const noGoal = await api('GET', '/goals/999999', null, state.accessToken);
    assert(noGoal.status === 404, `Negative — Nonexistent goal returns 404 (got ${noGoal.status})`);

    // ── Update goal ──
    const updated = await api('PUT', `/goals/${state.goalIds[0]}`, {
        title: 'E2E Tatil Updated',
        current_amount: 2500,
    }, state.accessToken);
    assert(updated.status === 200, `Update goal returns 200 OK (got ${updated.status})`);

    // ── Delete goal ──
    const delGoalId = state.goalIds.pop(); // Remove goal 3
    const deleted = await api('DELETE', `/goals/${delGoalId}`, null, state.accessToken);
    assert(deleted.status === 200, `Delete goal returns 200 OK`);

    // ── NEGATIVE: Delete already deleted ──
    const reDel = await api('DELETE', `/goals/${delGoalId}`, null, state.accessToken);
    assert(reDel.status === 404, `Negative — Re-delete returns 404 (got ${reDel.status})`);
};
