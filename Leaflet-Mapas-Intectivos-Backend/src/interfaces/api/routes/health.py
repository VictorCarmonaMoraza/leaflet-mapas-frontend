from fastapi import APIRouter

from src.application.use_cases.get_health_status import GetHealthStatusUseCase

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health_check() -> dict:
    use_case = GetHealthStatusUseCase()
    return use_case.execute()

