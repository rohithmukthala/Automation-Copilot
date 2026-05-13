import logging

from fastapi import APIRouter, HTTPException

from backend.models.schemas import GenerateRequest, GenerateResponse
from backend.services.copilot_service import generate_workflow

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["copilot"])


@router.post("/copilot/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest) -> GenerateResponse:
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt must not be empty")

    logger.info("Generate request: prompt=%s", request.prompt[:120])

    workflow = await generate_workflow(request.prompt)
    return GenerateResponse(workflow=workflow)
