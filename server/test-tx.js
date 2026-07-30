import { api } from './tests/helpers.js';
(async () => {
    try {
        const email = `test_${Date.now()}@test.com`;
        const res = await api('POST', '/auth/signup', { fullname: 'Test', email, password: 'Password123!' });
        console.log("Signup:", res.status);
        const token = res.data?.access_token || res.access_token;
        if (!token) console.log("No token", res);
        const tx1 = await api('POST', '/engine/chat', { input: 'markete 150 TL harcadım', history: [] }, token);
        console.log(JSON.stringify(tx1, null, 2));
    } catch (e) {
        console.error(e);
    }
})();
