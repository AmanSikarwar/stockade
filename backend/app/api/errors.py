from fastapi import HTTPException


def error_detail(code: str, message: str, **extra: object) -> dict[str, object]:
    detail: dict[str, object] = {
        "code": code,
        "message": message,
    }
    detail.update(extra)
    return detail


def http_error(
    status_code: int,
    code: str,
    message: str,
    *,
    headers: dict[str, str] | None = None,
    **extra: object,
) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail=error_detail(code, message, **extra),
        headers=headers,
    )
