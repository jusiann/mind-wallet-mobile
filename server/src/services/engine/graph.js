import { StateGraph } from '@langchain/langgraph';
import { EngineState } from './state.js';
import { classifierNode } from './nodes/classifier.node.js';
import { guardrailNode }  from './nodes/guardrail.node.js';
import { analysisNode }   from './nodes/analysis.node.js';
import { routingNode }    from './nodes/routing.node.js';

const routeAfterClassifier = (state) =>
    state.classification === 'TRANSACTION' ? 'guardrail' : 'analysis';

const graph = new StateGraph(EngineState)
    .addNode('classifier', classifierNode)
    .addNode('guardrail',  guardrailNode)
    .addNode('analysis',   analysisNode)
    .addNode('routing',    routingNode)
    .addEdge('__start__', 'classifier')
    .addConditionalEdges('classifier', routeAfterClassifier, {
        guardrail: 'guardrail',
        analysis:  'analysis',
    })
    .addEdge('guardrail', '__end__')
    .addEdge('analysis',  'routing')
    .addEdge('routing',   '__end__');

export const engineGraph = graph.compile();

// Doğrudan guardrail çalıştırmak için (transaction.controller.js'de kullanılır)
export const runGuardRail = async (activeGoals, pendingTransaction) => {
    const result = await guardrailNode({ activeGoals, pendingTransaction });
    return result.warning ?? null;
};
