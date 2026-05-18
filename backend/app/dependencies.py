from fastapi import Request

from app.services.context import ApplicationContext


def get_context(request: Request) -> ApplicationContext:
    return request.app.state.context

