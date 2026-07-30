// ═══════════════════════════════════════════════════════════════
//  Cleanup Tests — Account deletion & teardown verification
// ═══════════════════════════════════════════════════════════════

import { TEST_USER, state, assert, api, section } from './helpers.js';

export const testCleanup = async () => {
    section('9. TEARDOWN');

    // ── Delete account ──
    const del = await api('DELETE', '/auth/delete-account', {
        password: TEST_USER.password,
    }, state.accessToken);
    assert(del.status === 200, `Account deletion returns 200 OK (got ${del.status})`);

    // ── Verify deleted account can no longer authenticate ──
    const afterDelete = await api('GET', '/auth/me', null, state.accessToken);
    assert(afterDelete.status === 401, `Deleted account can no longer authenticate (got ${afterDelete.status})`);

    // ── Verify login with deleted account fails ──
    const loginAttempt = await api('POST', '/auth/signin', {
        email: TEST_USER.email,
        password: TEST_USER.password,
    });
    assert(loginAttempt.status === 401 || loginAttempt.status === 404,
        `Login with deleted account fails (got ${loginAttempt.status})`);
};
