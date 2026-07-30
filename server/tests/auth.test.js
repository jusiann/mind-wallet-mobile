// ═══════════════════════════════════════════════════════════════
//  Auth Tests — Register, Login, Profile, Token, Negative cases
// ═══════════════════════════════════════════════════════════════

import { TEST_USER, state, assert, api, section, sleep } from './helpers.js';

export const testAuth = async () => {
    section('1. AUTHENTICATION');

    // ── Register (do this first to avoid rate limit issues) ──
    const signup = await api('POST', '/auth/signup', {
        fullname: TEST_USER.fullname,
        email: TEST_USER.email,
        password: TEST_USER.password,
    });
    assert(signup.status === 201, `Register returns 201 Created (got ${signup.status})`);
    assert(signup.success === true, 'Register payload reports success');
    assert(signup.access_token && signup.refresh_token, 'Register returns tokens');

    state.accessToken = signup.access_token;
    state.refreshToken = signup.refresh_token;

    // ── GET /me ──
    const me = await api('GET', '/auth/me', null, state.accessToken);
    assert(me.status === 200, `Fetch profile returns 200 OK`);
    assert(me.user?.email === TEST_USER.email, 'Profile email matches test user');
    if (me.user?.id) state.userId = me.user.id;

    // ── PATCH /me (Update profile) ──
    const update = await api('PATCH', '/auth/me', { name: 'E2E Updated User' }, state.accessToken);
    assert(update.status === 200, `Update profile returns 200 OK (got ${update.status})`);

    // ── Login ──
    const signin = await api('POST', '/auth/signin', {
        email: TEST_USER.email,
        password: TEST_USER.password,
    });
    assert(signin.status === 200, `Login returns 200 OK (got ${signin.status})`);
    assert(signin.access_token, 'Login returns access_token');

    state.accessToken = signin.access_token;
    state.refreshToken = signin.refresh_token;

    // ── Refresh token ──
    const refresh = await api('POST', '/auth/refresh-token', {
        refresh_token: state.refreshToken,
    });
    assert(refresh.status === 200, `Refresh token returns 200 OK`);
    assert(refresh.access_token, 'New access_token generated');

    state.accessToken = refresh.access_token;
    state.refreshToken = refresh.refresh_token;

    // ── NEGATIVE: No token ──
    const noToken = await api('GET', '/auth/me');
    assert(noToken.status === 401, `Unauthorized request without token blocked (401)`);

    // ── NEGATIVE: Invalid token ──
    const badToken = await api('GET', '/auth/me', null, 'invalid.token.value');
    assert(badToken.status === 401, `Invalid token rejected (401)`);

    // ── NEGATIVE: Login with non-existent user ──
    const badLogin = await api('POST', '/auth/signin', {
        email: 'nobody@mindwallet.com',
        password: 'wrongpassword',
    });
    assert(badLogin.status === 401 || badLogin.status === 404, `Negative — Invalid login blocked (got ${badLogin.status})`);

    // ── NEGATIVE: Wrong password ──
    const wrongPw = await api('POST', '/auth/signin', {
        email: TEST_USER.email,
        password: 'TotallyWrongPW999',
    });
    assert(wrongPw.status === 401 || wrongPw.status === 400, `Negative — Wrong password blocked (got ${wrongPw.status})`);
};
