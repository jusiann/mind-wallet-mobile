import { Annotation } from '@langchain/langgraph';

export const EngineState = Annotation.Root({
    userId:             Annotation({ reducer: (_, y) => y ?? _, default: () => null }),
    currentInput:       Annotation({ reducer: (_, y) => y ?? _, default: () => '' }),
    pastTransactions:   Annotation({ reducer: (_, y) => y ?? _, default: () => [] }),
    currentMonthTx:     Annotation({ reducer: (_, y) => y ?? _, default: () => [] }),
    previousMonthTx:    Annotation({ reducer: (_, y) => y ?? _, default: () => [] }),
    categoryDeltas:     Annotation({ reducer: (_, y) => y ?? _, default: () => [] }),
    activeGoals:        Annotation({ reducer: (_, y) => y ?? _, default: () => [] }),
    categories:         Annotation({ reducer: (_, y) => y ?? _, default: () => [] }),
    pendingTransaction: Annotation({ reducer: (_, y) => y ?? _, default: () => null }),
    classification:     Annotation({ reducer: (_, y) => y ?? _, default: () => null }),
    detectedSavings:    Annotation({ reducer: (_, y) => y ?? _, default: () => 0 }),
    wastefulCategories: Annotation({ reducer: (_, y) => y ?? _, default: () => [] }),
    optimizedRoute:     Annotation({ reducer: (_, y) => y ?? _, default: () => null }),
    warning:            Annotation({ reducer: (_, y) => y ?? _, default: () => null }),
    label:              Annotation({ reducer: (_, y) => y ?? _, default: () => 'Normal' }),
    message:            Annotation({ reducer: (_, y) => y ?? _, default: () => '' }),
    chatHistory:        Annotation({ reducer: (_, y) => y ?? _, default: () => [] }),
    buttonPayload:      Annotation({ reducer: (_, y) => y ?? _, default: () => null }),
    buttons:            Annotation({ reducer: (_, y) => y ?? _, default: () => null }),
    pendingData:        Annotation({ reducer: (_, y) => y ?? _, default: () => null }),
});
