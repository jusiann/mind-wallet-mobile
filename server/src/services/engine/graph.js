import { StateGraph } from '@langchain/langgraph';
import { EngineState } from './state.js';
import { intentNode } from './nodes/intent.node.js';
import { extractorNode } from './nodes/extractor.node.js';
import { guardrailNode } from './nodes/guardrail.node.js';
import { analysisNode } from './nodes/analysis.node.js';
import { routingNode } from './nodes/routing.node.js';
import { tipsNode } from './nodes/tips.node.js';
import { responderNode } from './nodes/responder.node.js';

// ═══════════════════════════════════════════════════════════════
//  LangGraph StateGraph — Mind Wallet AI Engine
// ═══════════════════════════════════════════════════════════════

const graph = new StateGraph(EngineState);

// ── Add Nodes ──
graph.addNode('classifier', intentNode);
graph.addNode('extractor', extractorNode);
graph.addNode('guardrail', guardrailNode);
graph.addNode('analysis', analysisNode);
graph.addNode('routing', routingNode);
graph.addNode('tips', tipsNode);
graph.addNode('responder', responderNode);

// ── Entry Point ──
graph.addEdge('__start__', 'classifier');

// ── Conditional routing after intent classification ──
graph.addConditionalEdges('classifier', (state) => {
    const { intent } = state;

    // Intents that need extraction
    if (intent === 'TRANSACTION' || intent === 'GOAL_CREATION' || intent === 'GOAL_CONTRIBUTION') {
        return 'extractor';
    }

    // Analysis flow
    if (intent === 'ANALYSIS' || intent === 'ACTION_ANALYSIS') {
        return 'analysis';
    }

    // Tips flow
    if (intent === 'TIPS' || intent === 'ACTION_TIPS') {
        return 'tips';
    }

    // Everything else goes straight to responder
    // CHITCHAT, OUT_OF_SCOPE, GOAL_STATUS, CANCEL, ACTION_TRANSACTION_START,
    // ACTION_GOAL_START, ACTION_SET_DEADLINE, ACTION_GOAL_CONTRIBUTION_START,
    // ACTION_SELECT_GOAL, ACTION_UNKNOWN
    return 'responder';
});

// ── After extractor: route based on intent ──
graph.addConditionalEdges('extractor', (state) => {
    const { intent, pendingData, response } = state;

    // If extractor set a complete error response, go to responder
    if (response?.message && response.message !== '') {
        return 'responder';
    }

    // Transaction → guardrail check before responder
    if (intent === 'TRANSACTION' && pendingData?.type === 'transaction') {
        return 'guardrail';
    }

    // Goal creation / contribution → straight to responder
    return 'responder';
});

// ── After guardrail → responder ──
graph.addEdge('guardrail', 'responder');

// ── After analysis → routing ──
graph.addEdge('analysis', 'routing');

// ── After routing → responder ──
graph.addEdge('routing', 'responder');

// ── After tips → __end__ (tips node sets response directly) ──
graph.addEdge('tips', '__end__');

// ── After responder → __end__ ──
graph.addEdge('responder', '__end__');

// ── Compile ──
const compiledGraph = graph.compile();

// ═══════════════════════════════════════════════════════════════
//  Public API — invoke the graph
// ═══════════════════════════════════════════════════════════════

/**
 * Run the full LangGraph engine pipeline.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.input - User's text message
 * @param {object|null} params.actionPayload - Button payload
 * @param {Array} params.chatHistory - Recent chat messages
 * @param {object} params.context - DB context from contextCache
 * @returns {Promise<object>} - { message, buttons, classification, ... }
 */
export const runEngine = async ({ userId, input, actionPayload, chatHistory, context }) => {
    const result = await compiledGraph.invoke({
        userId,
        input: input ?? '',
        actionPayload: actionPayload ?? null,
        chatHistory: chatHistory ?? [],
        context,
    });

    return result.response;
};

// Note: For direct transaction API guardrail, use:
// import { runGuardRail } from '../services/engine/guardrail.js'
// (guardrail.js is kept as standalone for transaction.controller.js)
