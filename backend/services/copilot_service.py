import logging
import os

from fastapi import HTTPException
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from backend.models.schemas import N8nWorkflow

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert n8n workflow architect. Your job is to convert plain English automation descriptions into valid n8n workflow JSON.

Rules:
- Always include at least one trigger node (the first node) and one action node.
- Use real n8n node type identifiers (e.g. n8n-nodes-base.typeformTrigger, n8n-nodes-base.twilio, n8n-nodes-base.gmail, n8n-nodes-base.httpRequest, n8n-nodes-base.slack, n8n-nodes-base.googleSheets, n8n-nodes-base.hubspot, n8n-nodes-base.scheduleTrigger).
- Node IDs must be short unique strings (e.g. "node_1", "node_2").
- Positions: place the first node at [250, 300], then space each subsequent node 250px to the right.
- Connections must reference exact node names.
- Include realistic placeholder parameters for each node (e.g. formId, to, from, message, channel, sheetId).
- Keep the workflow name concise and descriptive.

Connection format example:
"connections": {{
  "Typeform Trigger": {{
    "main": [[{{"node": "Send WhatsApp", "type": "main", "index": 0}}]]
  }}
}}
"""


def _build_chain():
    llm = ChatOpenAI(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        temperature=0,
    )
    structured_llm = llm.with_structured_output(N8nWorkflow, method="function_calling")
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Create an n8n workflow for: {prompt}"),
    ])
    return prompt | structured_llm


async def generate_workflow(prompt: str) -> N8nWorkflow:
    chain = _build_chain()

    for attempt in range(1, 3):
        try:
            logger.info("Generating workflow (attempt %d) for prompt: %s", attempt, prompt[:120])
            result = await chain.ainvoke({"prompt": prompt})
            logger.info("Workflow generated successfully on attempt %d", attempt)
            return result
        except Exception:
            logger.warning("Attempt %d failed for prompt: %s", attempt, prompt[:80], exc_info=True)
            if attempt == 2:
                logger.error("Both attempts failed — returning error to caller")
                raise HTTPException(
                    status_code=500,
                    detail="Failed to generate workflow. The LLM could not produce a valid response. Please rephrase your prompt and try again.",
                )
