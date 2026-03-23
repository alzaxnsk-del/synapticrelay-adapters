"""
FastAPI decorators and utilities for SynapticRelay integration.

Provides ready-made route handlers for health and invoke endpoints.
"""

from __future__ import annotations

from functools import wraps
from typing import Any, Callable

# Type hints for when FastAPI is available
try:
    from fastapi import Request, Response
    from fastapi.responses import JSONResponse
except ImportError:
    Request = Any  # type: ignore
    Response = Any  # type: ignore
    JSONResponse = Any  # type: ignore


def synapticrelay_health(
    version: str = "1.0.0",
    capabilities: list[str] | None = None,
):
    """Decorator that adds SynapticRelay-compatible health check logic.

    Use on a FastAPI route handler:

        @app.get("/health")
        @synapticrelay_health(version="1.0.0", capabilities=["summarize"])
        async def health():
            return {"custom": "data"}  # merged into health response
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            result = await func(*args, **kwargs)
            custom_data = result if isinstance(result, dict) else {}

            health_response = {
                "status": "healthy",
                "version": version,
                **custom_data,
            }
            if capabilities:
                health_response["capabilities"] = capabilities

            return health_response

        return wrapper

    return decorator


def synapticrelay_invoke(
    handler_map: dict[str, Callable] | None = None,
):
    """Decorator that wraps a FastAPI route with SynapticRelay invoke contract handling.

    Parses the invocation request, routes to the appropriate capability handler,
    and formats the response.

    Usage:
        capability_handlers = {
            "summarize": handle_summarize,
            "translate": handle_translate,
        }

        @app.post("/invoke")
        @synapticrelay_invoke(handler_map=capability_handlers)
        async def invoke(request: Request):
            pass  # Handled by decorator
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(request: Request, *args: Any, **kwargs: Any) -> Any:
            try:
                body = await request.json()
            except Exception:
                return JSONResponse(
                    status_code=400,
                    content={
                        "invocationId": "unknown",
                        "status": "failed",
                        "error": {"code": "INVALID_REQUEST", "message": "Invalid JSON body"},
                    },
                )

            invocation_id = body.get("invocationId", "unknown")
            capability = body.get("capability")
            input_data = body.get("input", {})

            if not capability:
                return JSONResponse(
                    status_code=400,
                    content={
                        "invocationId": invocation_id,
                        "status": "failed",
                        "error": {"code": "MISSING_CAPABILITY", "message": "capability field is required"},
                    },
                )

            # Route to handler
            if handler_map and capability in handler_map:
                try:
                    output = await handler_map[capability](input_data)
                    return {
                        "invocationId": invocation_id,
                        "status": "completed",
                        "output": output,
                    }
                except Exception as e:
                    return JSONResponse(
                        status_code=500,
                        content={
                            "invocationId": invocation_id,
                            "status": "failed",
                            "error": {"code": "EXECUTION_ERROR", "message": str(e)},
                        },
                    )

            # If no handler map, delegate to the wrapped function
            return await func(request, *args, **kwargs)

        return wrapper

    return decorator
