from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.models.schemas import N8nNode, N8nWorkflow

client = TestClient(app)

MOCK_WORKFLOW = N8nWorkflow(
    name="Typeform to WhatsApp",
    nodes=[
        N8nNode(
            id="node_1",
            name="Typeform Trigger",
            type="n8n-nodes-base.typeformTrigger",
            typeVersion=1,
            position=[250, 300],
            parameters={"formId": "abc123"},
        ),
        N8nNode(
            id="node_2",
            name="Send WhatsApp",
            type="n8n-nodes-base.twilio",
            typeVersion=1,
            position=[500, 300],
            parameters={"to": "+1234567890", "message": "New form submission!"},
        ),
    ],
    connections={
        "Typeform Trigger": {
            "main": [[{"node": "Send WhatsApp", "type": "main", "index": 0}]]
        }
    },
)


@patch("backend.api.routes.generate_workflow", new_callable=AsyncMock)
def test_generate_success(mock_generate):
    mock_generate.return_value = MOCK_WORKFLOW

    res = client.post("/api/copilot/generate", json={"prompt": "Send WhatsApp when Typeform is filled"})

    assert res.status_code == 200
    body = res.json()
    assert "workflow" in body
    assert body["workflow"]["name"] == "Typeform to WhatsApp"
    assert len(body["workflow"]["nodes"]) == 2
    mock_generate.assert_awaited_once()


def test_generate_empty_prompt():
    res = client.post("/api/copilot/generate", json={"prompt": "   "})
    assert res.status_code == 400
    assert "empty" in res.json()["detail"].lower()


def test_generate_missing_prompt():
    res = client.post("/api/copilot/generate", json={})
    assert res.status_code == 422


@patch("backend.api.routes.generate_workflow", new_callable=AsyncMock)
def test_generate_llm_failure(mock_generate):
    from fastapi import HTTPException
    mock_generate.side_effect = HTTPException(status_code=500, detail="Failed to generate workflow.")

    res = client.post("/api/copilot/generate", json={"prompt": "Do something complex"})
    assert res.status_code == 500
    assert "Failed" in res.json()["detail"]


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
