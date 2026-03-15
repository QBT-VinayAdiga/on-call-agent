# tests/test_agents.py

import pytest
from app.graph import AgentState
from app.agents.triage import triage_node
from app.agents.summary import summary_node
from app.agents.comms import comms_node
from app.agents.pir import pir_node

@pytest.fixture
def mock_incident():
    return {
        "incident_id": "INC-123",
        "title": "Database CPU Spike",
        "severity": "SEV2",
        "timeframe": {"start": "2024-09-15T14:00:00Z"},
        "alerts": [],
        "logs": [],
        "metrics": [],
        "runbook_excerpt": "",
        "constraints": {}
    }

@pytest.fixture
def base_state(mock_incident):
    return {
        "incident": mock_incident,
        "correlation_id": "test-id",
        "agent_errors": {},
        "telemetry": {}
    }

def test_triage_node_structure(base_state):
    # This test will be updated as T013 is implemented
    result = triage_node(base_state)
    assert "triage_output" in result

def test_summary_node_logic(base_state):
    # This test will be meaningful after T016 is implemented
    result = summary_node(base_state)
    assert "summary_output" in result

def test_comms_node_logic(base_state):
    # This test will be meaningful after T017 is implemented
    result = comms_node(base_state)
    assert "comms_output" in result

def test_pir_node_logic(base_state):
    # This test will be meaningful after T020 is implemented
    result = pir_node(base_state)
    assert "pir_output" in result
