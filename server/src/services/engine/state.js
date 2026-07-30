import { Annotation } from '@langchain/langgraph';

/**
 * LangGraph State Annotation for Mind Wallet AI Engine.
 * All nodes share and update this state object.
 */
export const EngineState = Annotation.Root({
    // ── Input ──
    userId:       Annotation({ reducer: (_, v) => v, default: () => null }),
    input:        Annotation({ reducer: (_, v) => v, default: () => '' }),
    chatHistory:  Annotation({ reducer: (_, v) => v, default: () => [] }),
    actionPayload: Annotation({ reducer: (_, v) => v, default: () => null }),

    // ── DB Context (from contextCache) ──
    context: Annotation({
        reducer: (_, v) => v,
        default: () => ({
            currentMonthTx: [],
            previousMonthTx: [],
            activeGoals: [],
            categories: [],
        }),
    }),

    // ── Intent Classification ──
    intent: Annotation({ reducer: (_, v) => v, default: () => null }),

    // ── Extracted Data ──
    pendingData: Annotation({ reducer: (_, v) => v, default: () => null }),

    // ── Guardrail ──
    warning: Annotation({ reducer: (_, v) => v, default: () => null }),

    // ── Analysis Results ──
    analysisResult: Annotation({
        reducer: (_, v) => v,
        default: () => null,
    }),

    // ── Response (final output) ──
    response: Annotation({
        reducer: (_, v) => v,
        default: () => ({ message: '', buttons: null, classification: null }),
    }),
});
