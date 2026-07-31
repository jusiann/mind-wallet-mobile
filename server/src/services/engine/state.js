import { Annotation } from '@langchain/langgraph';

export const EngineState = Annotation.Root({
    userId:       Annotation({ reducer: (_, v) => v, default: () => null }),
    input:        Annotation({ reducer: (_, v) => v, default: () => '' }),
    chatHistory:  Annotation({ reducer: (_, v) => v, default: () => [] }),
    actionPayload: Annotation({ reducer: (_, v) => v, default: () => null }),

    context: Annotation({
        reducer: (_, v) => v,
        default: () => ({
            currentMonthTx: [],
            previousMonthTx: [],
            activeGoals: [],
            categories: [],
        }),
    }),

    intent: Annotation({ reducer: (_, v) => v, default: () => null }),

    pendingData: Annotation({ reducer: (_, v) => v, default: () => null }),

    warning: Annotation({ reducer: (_, v) => v, default: () => null }),

    analysisResult: Annotation({
        reducer: (_, v) => v,
        default: () => null,
    }),

    response: Annotation({
        reducer: (_, v) => v,
        default: () => ({ message: '', buttons: null, classification: null }),
    }),
});
