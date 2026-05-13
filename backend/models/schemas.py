from pydantic import BaseModel, Field
from typing import Optional


class N8nNode(BaseModel):
    id: str = Field(description="Unique node identifier (UUID string)")
    name: str = Field(description="Human-readable node label shown in the canvas")
    type: str = Field(description="n8n node type identifier, e.g. n8n-nodes-base.httpRequest")
    typeVersion: int = Field(description="Version of the node type, usually 1")
    position: list[int] = Field(description="[x, y] canvas coordinates")
    parameters: dict = Field(default_factory=dict, description="Node-specific parameter values")


class N8nWorkflow(BaseModel):
    name: str = Field(description="Descriptive workflow name")
    nodes: list[N8nNode] = Field(description="All nodes in the workflow")
    connections: dict = Field(
        default_factory=dict,
        description=(
            "Connection map: { 'SourceNodeName': { 'main': [[{ 'node': 'TargetNodeName', "
            "'type': 'main', 'index': 0 }]] } }"
        ),
    )
    active: bool = False
    settings: dict = Field(default_factory=dict)


class GenerateRequest(BaseModel):
    prompt: str


class GenerateResponse(BaseModel):
    workflow: N8nWorkflow


class ErrorResponse(BaseModel):
    detail: str
