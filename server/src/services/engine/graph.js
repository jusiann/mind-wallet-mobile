import { StateGraph } from "@langchain/langgraph";
import { EngineState } from "./state.js";
import { classifierNode } from "./nodes/classifier.node.js";
import { extractorNode } from "./nodes/extractor.node.js";
import { guardrailNode } from "./nodes/guardrail.node.js";
import { analysisNode } from "./nodes/analysis.node.js";
import { routingNode } from "./nodes/routing.node.js";
import { responderNode } from "./nodes/responder.node.js";

const BUTTON_ONLY_ACTIONS = new Set([
  "reduce_category",
  "get_tips",
  "route_savings",
  "confirm_routing",
  "confirm_pledge",
  "set_deadline",
  "start_goal",
  "start_transaction",
]);

const ANALYSIS_ACTIONS = new Set(["back_to_analysis", "start_analysis"]);

const routeFromStart = (state) => {
  const action = state.buttonPayload?.action;
  if (action && BUTTON_ONLY_ACTIONS.has(action)) return "responder";
  if (action && ANALYSIS_ACTIONS.has(action)) return "analysis";
  return "classifier";
};

const routeAfterClassifier = (state) => {
  if (state.classification === "TRANSACTION") return "extractor";
  if (state.classification === "GOAL_CREATION") return "extractor";
  if (state.classification === "GOAL_CONTRIBUTION") return "extractor";
  if (state.classification === "GOAL_STATUS") return "responder";
  if (state.classification === "CHITCHAT") return "responder";
  return "analysis";
};

const routeAfterExtractor = (state) => {
  if (state.classification === "TRANSACTION") return "guardrail";
  return "responder";
};


const graph = new StateGraph(EngineState)
  .addNode("classifier", classifierNode)
  .addNode("extractor", extractorNode)
  .addNode("guardrail", guardrailNode)
  .addNode("analysis", analysisNode)
  .addNode("routing", routingNode)
  .addNode("responder", responderNode)
  .addConditionalEdges("__start__", routeFromStart, {
    classifier: "classifier",
    responder: "responder",
    analysis: "analysis",
  })
  .addConditionalEdges("classifier", routeAfterClassifier, {
    extractor: "extractor",
    analysis: "analysis",
    responder: "responder",
  })
  .addConditionalEdges("extractor", routeAfterExtractor, {
    guardrail: "guardrail",
    responder: "responder",
  })
  .addEdge("guardrail", "responder")
  .addEdge("analysis", "routing")
  .addEdge("routing", "responder")
  .addEdge("responder", "__end__");

export const engineGraph = graph.compile();

export const runGuardRail = async (activeGoals, pendingTransaction) => {
  const result = await guardrailNode({ activeGoals, pendingTransaction });
  return result.warning ?? null;
};
