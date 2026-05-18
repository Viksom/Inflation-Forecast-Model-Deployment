from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.settings import ALLOWED_ORIGIN_REGEX, ALLOWED_ORIGINS, FUTURE_START
from app.loaders.app_loader import load_application_context
from app.routers.api import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.context = load_application_context()
    yield


app = FastAPI(
    title="InflacaoPT Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    message = "; ".join(error.get("msg", "Invalid request") for error in exc.errors())
    return JSONResponse(status_code=422, content={"detail": message})


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(Exception)
async def internal_exception_handler(_: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": str(exc) or "Internal server error"})


@app.get("/health")
def health(request: Request):
    context = request.app.state.context
    return {
        "status": "ok",
        "models": list(context.models.keys()),
        "dataStart": context.raw_data.index.min().strftime("%Y-%m"),
        "dataEnd": context.raw_data.index.max().strftime("%Y-%m"),
        "futureStart": FUTURE_START[:7],
    }


app.include_router(api_router)
