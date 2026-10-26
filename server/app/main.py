from __future__ import annotations

from contextlib import asynccontextmanager
import logging
from typing import AsyncIterator

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo import MongoClient

from .api.routes import create_router
from .config import Settings, settings
from .lifecycle import LifecycleService
from .repository import MongoLifecycleRepository
from .runtime.assessment_runtime import AssessmentRuntime
from .seed import seed_demo_portfolio

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("ontology.api")


def create_app(configuration: Settings = settings) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        mongo_client = MongoClient(
            configuration.mongodb_uri,
            serverSelectionTimeoutMS=5000,
            tz_aware=True,
        )
        mongo_client.admin.command("ping")
        repository = MongoLifecycleRepository(mongo_client, configuration.mongodb_database)
        runtime = AssessmentRuntime(repository, mongo_client, configuration.mongodb_database)
        service = LifecycleService(repository, runtime, configuration.max_assessment_workers)
        service.initialize()
        if configuration.seed_demo_data:
            seed_demo_portfolio(service)
        app.state.mongo_client = mongo_client
        app.state.repository = repository
        app.state.lifecycle = service
        logger.info("Ontology Lifecycle API started with Python LangGraph runtime")
        try:
            yield
        finally:
            service.close()
            mongo_client.close()

    app = FastAPI(
        title="Ontology AI Governance API",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[configuration.client_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(LookupError)
    async def not_found(_request: Request, error: LookupError) -> JSONResponse:
        return JSONResponse(status_code=404, content={"error": str(error)})

    @app.exception_handler(ValueError)
    async def bad_request(_request: Request, error: ValueError) -> JSONResponse:
        return JSONResponse(status_code=400, content={"error": str(error)})

    @app.exception_handler(HTTPException)
    async def http_error(_request: Request, error: HTTPException) -> JSONResponse:
        message = error.detail if isinstance(error.detail, str) else "Request failed"
        return JSONResponse(status_code=error.status_code, content={"error": message})

    @app.exception_handler(Exception)
    async def request_failed(_request: Request, error: Exception) -> JSONResponse:
        logger.exception("Request failed", exc_info=error)
        return JSONResponse(status_code=500, content={"error": "Request failed"})

    app.include_router(create_router())
    app.state.configuration = configuration
    return app
app = create_app()
