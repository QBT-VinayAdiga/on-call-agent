# tests/test_evals.py

import braintrust
from braintrust import Eval
from app.agents.triage import triage_node
from app.schemas import TRIAGE_OUTPUT_SCHEMA
import jsonschema
import json
import os
import pytest

def load_golden_set(path: str = "scripts/golden_outputs/") -> list[dict]:
    golden = []
    if not os.path.exists(path):
        return []
    for f in os.listdir(path):
        if f.endswith(".json"):
            with open(os.path.join(path, f)) as fp:
                golden.append(json.load(fp))
    return golden

def schema_valid_scorer(output: dict, expected: dict) -> dict:
    # Handle both wrapped (from node) and unwrapped (from direct call) outputs
    actual_output = output.get("triage_output") if isinstance(output, dict) and "triage_output" in output else output
    
    if not actual_output:
        return {"name": "schema_valid", "score": 0.0, "metadata": {"error": "Empty output"}}
        
    try:
        jsonschema.validate(instance=actual_output, schema=TRIAGE_OUTPUT_SCHEMA)
        return {"name": "schema_valid", "score": 1.0}
    except jsonschema.ValidationError as e:
        return {"name": "schema_valid", "score": 0.0, "metadata": {"error": e.message}}

def root_cause_overlap_scorer(output: dict, expected: dict) -> dict:
    actual_output = output.get("triage_output") if isinstance(output, dict) and "triage_output" in output else output
    
    expected_hypotheses = {rc["hypothesis"] for rc in expected.get("suspected_root_causes", [])}
    output_hypotheses = {rc["hypothesis"] for rc in actual_output.get("suspected_root_causes", [])} if actual_output else set()
    
    if not expected_hypotheses:
        return {"name": "root_cause_overlap", "score": 1.0}
    
    overlap = len(expected_hypotheses & output_hypotheses) / len(expected_hypotheses)
    return {"name": "root_cause_overlap", "score": overlap}

def run_triage_eval():
    if not os.environ.get("BRAINTRUST_API_KEY"):
        print("Skipping eval: BRAINTRUST_API_KEY not set")
        return

    Eval(
        project="on-call-agent",
        experiment="triage-baseline",
        data=load_golden_set(),
        task=lambda example: triage_node({"incident": example["input"], "correlation_id": "eval", "agent_errors": {}}),
        scores=[schema_valid_scorer, root_cause_overlap_scorer],
    )

if __name__ == "__main__":
    run_triage_eval()
