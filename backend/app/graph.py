# app/graph.py

from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, Annotated, List
import operator

class AgentState(TypedDict):
    # Inputs
    incident: dict
    correlation_id: str
    
    # Internal Agent Outputs
    triage_output: Optional[dict]
    summary_output: Optional[dict]
    comms_output: Optional[dict]
    pir_output: Optional[dict]
    
    # Final Flattened Outputs (for UI)
    suspected_root_causes: Optional[List[dict]]
    immediate_actions: Optional[List[dict]]
    missing_information: Optional[List[dict]]
    runbook_alignment: Optional[dict]
    summary: Optional[dict]
    comms: Optional[dict]
    post_incident_report: Optional[dict]
    
    # Metadata & Errors
    agent_errors: Annotated[dict, operator.ior]  # Merge dictionaries
    telemetry: dict

def merge_node(state: AgentState) -> dict:
    """Consolidate agent outputs into a unified, flattened response for the UI."""
    triage = state.get("triage_output") or {}
    summary = state.get("summary_output") or {}
    comms = state.get("comms_output") or {}
    pir = state.get("pir_output") or {}
    errors = state.get("agent_errors") or {}
    
    # Extract telemetry from state to preserve provider/model info
    current_telemetry = state.get("telemetry", {})
    provider = current_telemetry.get("provider_override", "openrouter")

    return {
        "suspected_root_causes": triage.get("suspected_root_causes", []),
        "immediate_actions": triage.get("immediate_actions", []),
        "missing_information": triage.get("missing_information", []),
        "runbook_alignment": triage.get("runbook_alignment", {}),
        "summary": summary.get("summary", {}),
        "comms": comms.get("comms", {}),
        "post_incident_report": pir.get("post_incident_report", {}),
        "telemetry": {
            **current_telemetry,
            "correlation_id": state.get("correlation_id"),
            "agent_errors": errors,
            "final_provider": provider,
        }
    }

def create_incident_graph() -> StateGraph:
    """Compile the incident analysis graph."""
    from app.agents.triage import triage_node
    from app.agents.summary import summary_node
    from app.agents.comms import comms_node
    from app.agents.pir import pir_node

    workflow = StateGraph(AgentState)

    # Register nodes
    workflow.add_node("triage", triage_node)
    workflow.add_node("summary", summary_node)
    workflow.add_node("comms", comms_node)
    workflow.add_node("pir", pir_node)
    workflow.add_node("merge", merge_node)

    # Standard parallel fan-out from entry point
    # We use a dummy start node to trigger parallel execution
    workflow.add_node("start", lambda x: x)
    workflow.set_entry_point("start")
    
    workflow.add_edge("start", "triage")
    workflow.add_edge("start", "summary")
    workflow.add_edge("start", "comms")
    workflow.add_edge("start", "pir")

    # Converge at merge
    workflow.add_edge("triage", "merge")
    workflow.add_edge("summary", "merge")
    workflow.add_edge("comms", "merge")
    workflow.add_edge("pir", "merge")
    
    workflow.add_edge("merge", END)

    return workflow.compile()
