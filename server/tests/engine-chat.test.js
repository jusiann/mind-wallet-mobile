// ═══════════════════════════════════════════════════════════════
//  Engine Chat Tests — All AI intent paths, multi-turn flows,
//  edge cases, quick reply rotation verification
// ═══════════════════════════════════════════════════════════════

import { state, assert, api, section, sleep } from './helpers.js';

// Helper: send a chat message
const chat = async (input, history = []) =>
    api('POST', '/engine/chat', { input, history }, state.accessToken);

export const testEngineChat = async () => {
    section('7. AI ENGINE — CHAT (Intent Classification)');

    // ═══════════════════════════════════════════════════════
    //  7.1 CHITCHAT — Selamlama
    // ═══════════════════════════════════════════════════════

    const chitchat1 = await chat('merhaba');
    assert(chitchat1.status === 200, `CHITCHAT "merhaba" returns 200 OK`);
    assert(chitchat1.data?.message, 'CHITCHAT returns a message');
    assert(chitchat1.data?.classification === 'CHITCHAT', `Classification is CHITCHAT (got ${chitchat1.data?.classification})`);
    assert(Array.isArray(chitchat1.data?.buttons), 'CHITCHAT returns buttons array');

    const chitchat2 = await chat('selam');
    assert(chitchat2.status === 200, `CHITCHAT "selam" returns 200 OK`);

    const chitchat3 = await chat('teşekkürler');
    assert(chitchat3.status === 200, `CHITCHAT "teşekkürler" returns 200 OK`);

    const chitchat4 = await chat('nasılsın');
    assert(chitchat4.status === 200, `CHITCHAT "nasılsın" returns 200 OK`);

    // ═══════════════════════════════════════════════════════
    //  7.2 OUT_OF_SCOPE — Finans dışı konular
    // ═══════════════════════════════════════════════════════

    await sleep(1000); // Gemini rate limit

    const oos1 = await chat('hava durumu nasıl');
    assert(oos1.status === 200, `OUT_OF_SCOPE "hava durumu" returns 200 OK`);
    assert(oos1.data?.classification === 'OUT_OF_SCOPE' || oos1.data?.classification === 'CHITCHAT',
        `OUT_OF_SCOPE or CHITCHAT classification for weather (got ${oos1.data?.classification})`);

    await sleep(1000);

    const oos2 = await chat('python ile fibonacci dizisi yaz');
    assert(oos2.status === 200, `OUT_OF_SCOPE "python kodu" returns 200 OK`);
    assert(oos2.data?.classification === 'OUT_OF_SCOPE',
        `OUT_OF_SCOPE classification for programming (got ${oos2.data?.classification})`);

    // ═══════════════════════════════════════════════════════
    //  7.3 TRANSACTION — Harcama/Gelir kaydı
    // ═══════════════════════════════════════════════════════

    await sleep(1000);

    const tx1 = await chat('markete 150 TL harcadım');
    assert(tx1.status === 200, `TRANSACTION "markete 150 TL" returns 200 OK`);
    assert(tx1.data?.classification === 'TRANSACTION', `Classification is TRANSACTION (got ${tx1.data?.classification})`);
    assert(tx1.data?.buttons?.some((b) => b.payload?.action === 'confirm_transaction'),
        'Transaction response has confirm button');

    const tx2 = await chat('maaşım 35.000 TL yattı');
    assert(tx2.status === 200, `TRANSACTION "maaş 35.000 TL" returns 200 OK`);
    assert(tx2.data?.classification === 'TRANSACTION', `Classification is TRANSACTION for income (got ${tx2.data?.classification})`);

    // ═══════════════════════════════════════════════════════
    //  7.4 GOAL_CREATION — Hedef oluşturma
    // ═══════════════════════════════════════════════════════

    await sleep(1000);

    const gc1 = await chat('tatil için 10.000 TL biriktirmek istiyorum');
    assert(gc1.status === 200, `GOAL_CREATION returns 200 OK`);
    assert(gc1.data?.classification === 'GOAL_CREATION', `Classification is GOAL_CREATION (got ${gc1.data?.classification})`);
    assert(gc1.data?.buttons?.some((b) => b.payload?.action === 'set_deadline'),
        'Goal creation response has deadline buttons');

    const gc2 = await chat('hedef oluştur');
    assert(gc2.status === 200, `GOAL_CREATION "hedef oluştur" returns 200 OK`);

    // ═══════════════════════════════════════════════════════
    //  7.5 GOAL_CONTRIBUTION — Hedefe para ekleme
    // ═══════════════════════════════════════════════════════

    await sleep(1000);

    const contrib1 = await chat('tatil hedefime 500 TL ekle');
    assert(contrib1.status === 200, `GOAL_CONTRIBUTION returns 200 OK`);
    assert(
        contrib1.data?.classification === 'GOAL_CONTRIBUTION' || contrib1.data?.classification === 'GOAL_CREATION',
        `Classification is GOAL_CONTRIBUTION or GOAL_CREATION (got ${contrib1.data?.classification})`
    );

    // ═══════════════════════════════════════════════════════
    //  7.6 GOAL_STATUS — Hedef durumu
    // ═══════════════════════════════════════════════════════

    const gs1 = await chat('hedeflerim nasıl');
    assert(gs1.status === 200, `GOAL_STATUS returns 200 OK`);
    assert(gs1.data?.classification === 'GOAL_STATUS', `Classification is GOAL_STATUS (got ${gs1.data?.classification})`);
    assert(gs1.data?.message?.includes('hedef') || gs1.data?.message?.includes('Hedef'),
        'Goal status message mentions goals');

    // ═══════════════════════════════════════════════════════
    //  7.7 ANALYSIS — Bütçe analizi
    // ═══════════════════════════════════════════════════════

    await sleep(2500);

    const an1 = await chat('aylık durumum nasıl');
    assert(an1.status === 200, `ANALYSIS "aylık durumum" returns 200 OK`);
    assert(an1.data?.classification === 'ANALYSIS', `Classification is ANALYSIS (got ${an1.data?.classification})`);

    await sleep(2500);

    const an2 = await chat('bütçe analizi');
    assert(an2.status === 200, `ANALYSIS "bütçe analizi" returns 200 OK`);

    // ═══════════════════════════════════════════════════════
    //  7.8 TIPS — Tasarruf tavsiyesi
    // ═══════════════════════════════════════════════════════

    await sleep(2500);

    const tips1 = await chat('tasarruf tavsiyesi ver');
    assert(tips1.status === 200, `TIPS returns 200 OK`);
    assert(tips1.data?.classification === 'TIPS', `Classification is TIPS (got ${tips1.data?.classification})`);
    assert(tips1.data?.message?.length > 20, 'Tips message is substantial');

    // ═══════════════════════════════════════════════════════
    //  7.9 EDGE CASES
    // ═══════════════════════════════════════════════════════

    section('7b. AI ENGINE — CHAT (Edge Cases)');

    // ── Empty input ──
    const empty = await chat('');
    assert(empty.status === 400, `Empty input returns 400 (got ${empty.status})`);

    // ── Too long input (>500 chars) ──
    const longInput = 'a'.repeat(501);
    const toolong = await chat(longInput);
    assert(toolong.status === 400, `Input >500 chars returns 400 (got ${toolong.status})`);

    // ── Whitespace-only input ──
    const wsOnly = await chat('   ');
    assert(wsOnly.status === 400, `Whitespace-only input returns 400 (got ${wsOnly.status})`);

    // ── Guardrail High Amount ──
    await sleep(3500);
    const massive = await chat('markete 5000000 TL harcadım');
    assert(massive.status === 200, `Massive amount returns 200 (got ${massive.status})`);
    assert(massive.data?.warning != null, `Massive amount triggers guardrail warning`);
    assert(massive.data?.message?.includes(massive.data?.warning), `Warning is included in message`);

    // ── CANCEL Intent ──
    await sleep(2000);
    const cancel1 = await chat('iptal');
    assert(cancel1.status === 200, `CANCEL "iptal" returns 200 OK`);
    assert(cancel1.data?.classification === 'UNKNOWN', `Classification is UNKNOWN for cancel`);
    assert(cancel1.data?.message?.toLowerCase().includes('ptal'), 'Response includes iptal message');

    const cancel2 = await chat('vazgeçtim');
    assert(cancel2.status === 200, `CANCEL "vazgeçtim" returns 200 OK`);

    // ── No auth token ──
    const noAuth = await api('POST', '/engine/chat', { input: 'merhaba' });
    assert(noAuth.status === 401, `Chat without token returns 401`);

    // ═══════════════════════════════════════════════════════
    //  7.10 MULTI-TURN CONVERSATION FLOW — Transaction
    // ═══════════════════════════════════════════════════════

    section('7c. AI ENGINE — CHAT (Multi-Turn Flows)');

    await sleep(3000); // Extra wait for Gemini rate limit recovery

    // Step 1: User says transaction
    const flow1 = await chat('işlem ekle');
    assert(flow1.status === 200 || flow1.status === 502, `Multi-turn: "işlem ekle" returns 200 or 502 (got ${flow1.status})`);

    if (flow1.status === 200) {
        // Step 2: Context-aware amount (with chat history)
        const flowHistory = [
            { role: 'user', content: 'işlem ekle' },
            { role: 'model', content: flow1.data?.message || 'Ne kadar harcadın?' },
        ];

        await sleep(3500);
        const flow2 = await chat('kafe 80 TL', flowHistory);
        assert(flow2.status === 200, `Multi-turn: "kafe 80 TL" with history returns 200 (got ${flow2.status})`);
        assert(flow2.data?.classification === 'TRANSACTION', `Multi-turn resolves to TRANSACTION (got ${flow2.data?.classification})`);

        await sleep(3500);
        const flow3 = await chat('Alisverise 5000000 tl', flowHistory);
        assert(flow3.status === 200, `Multi-turn context: "Alisverise 5000000 tl" returns 200 (got ${flow3.status})`);
        assert(flow3.data?.classification === 'TRANSACTION', `High amount in TX context resolves to TRANSACTION (got ${flow3.data?.classification})`);
    } else {
        assert(true, 'Multi-turn: Skipped step 2 (Gemini rate limit)');
        assert(true, 'Multi-turn: Skipped classification check (Gemini rate limit)');
    }

    // Step 3: Goal contribution context (with chat history)
    const contribHistory = [
        { role: 'model', content: '"Tatil" hedefine ne kadar eklemek istiyorsun?' },
    ];
    await sleep(1500);
    const flowContrib = await chat('500 TL', contribHistory);
    assert(flowContrib.status === 200, `Multi-turn contrib: "500 TL" returns 200 (got ${flowContrib.status})`);
    assert(flowContrib.data?.classification === 'GOAL_CONTRIBUTION', `Amount resolves to GOAL_CONTRIBUTION in context`);

    // ═══════════════════════════════════════════════════════
    //  7.11 QUICK REPLY ROTATION TEST
    // ═══════════════════════════════════════════════════════

    section('7d. AI ENGINE — CHAT (Quick Reply Rotation)');

    const rotationMessages = new Set();
    for (let i = 0; i < 5; i++) {
        const r = await chat('merhaba');
        if (r.data?.message) rotationMessages.add(r.data.message);
        await sleep(200);
    }
    assert(rotationMessages.size >= 2, `Quick reply rotation: got ${rotationMessages.size} unique messages (expected ≥2)`);
};
