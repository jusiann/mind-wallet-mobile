// ═══════════════════════════════════════════════════════════════
//  Dashboard Tests — Summary, Stats, AI Insight
// ═══════════════════════════════════════════════════════════════

import { state, assert, api, section } from './helpers.js';

export const testDashboard = async () => {
    section('4. DASHBOARD');

    const dash = await api('GET', '/dashboard', null, state.accessToken);
    assert(dash.status === 200, `GET /dashboard returns 200 OK`);
    assert(dash.success === true, 'Dashboard reports success');

    const d = dash.data;
    if (!d) {
        assert(false, 'Dashboard data is missing — skipping remaining dashboard tests');
        return;
    }

    // ── Balance & income ──
    assert(d.total_balance !== undefined, 'total_balance field present');
    assert(d.monthly_income !== undefined, 'monthly_income field present');

    // ── Active goals ──
    assert(Array.isArray(d.active_goals), 'active_goals is an array');
    if (d.active_goals?.length > 0) {
        const g = d.active_goals[0];
        assert(g.title, 'Goal has title');
        assert(g.target_amount !== undefined, 'Goal has target_amount');
        assert(g.progress_pct !== undefined, 'Goal has progress_pct');
    }

    // ── Recent transactions ──
    assert(Array.isArray(d.recent_transactions), 'recent_transactions is an array');

    // ── Monthly stats ──
    const ms = d.monthly_stats;
    assert(ms, 'monthly_stats object present');
    if (ms) {
        assert(ms.total_income !== undefined, 'monthly_stats has total_income');
        assert(ms.total_expense !== undefined, 'monthly_stats has total_expense');
        assert(ms.net !== undefined, 'monthly_stats has net');
    }

    // ── AI Insight ──
    const ai = d.ai_insight;
    assert(ai, 'ai_insight object present');
    if (ai) {
        assert(ai.label, 'ai_insight has label');
        assert(ai.message, 'ai_insight has message');
        assert(['Yavaş', 'Hızlı', 'Normal'].includes(ai.label), `ai_insight.label is valid enum: "${ai.label}"`);
    }
};
