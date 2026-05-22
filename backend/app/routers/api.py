from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.dependencies import get_context
from app.schemas.api import (
    CorrelationMatrix,
    FeatureImportance,
    HorizonKey,
    InflationDataPoint,
    LagResponse,
    MacroVariable,
    ModelMetrics,
    ScenarioControl,
    ScenarioPreset,
    ScenarioSimulationRequest,
    SeriesPoint,
)
from app.services.analytics import AnalyticsService
from app.services.context import ApplicationContext
from app.services.forecasting import ForecastingService
from app.utils.json import json_safe


router = APIRouter(prefix="/api", tags=["api"])


@router.get("/inflation-series", response_model=list[InflationDataPoint])
def inflation_series(
    context: Annotated[ApplicationContext, Depends(get_context)],
    horizon: HorizonKey = "3M",
    model: str = "LightGBM",
):
    return json_safe(ForecastingService(context).inflation_series(horizon=horizon, selected_model=model))


@router.get("/model-metrics", response_model=list[ModelMetrics])
def model_metrics(context: Annotated[ApplicationContext, Depends(get_context)]):
    return json_safe(ForecastingService(context).model_metrics())


@router.get("/current-inflation", response_model=list[SeriesPoint])
def current_inflation(context: Annotated[ApplicationContext, Depends(get_context)]):
    return json_safe(AnalyticsService(context).current_inflation())


@router.get("/feature-importance", response_model=list[FeatureImportance])
def feature_importance(
    context: Annotated[ApplicationContext, Depends(get_context)],
    model: str = "LightGBM",
):
    return json_safe(ForecastingService(context).feature_importance(model))


@router.get("/scenario-presets", response_model=list[ScenarioPreset])
def scenario_presets(context: Annotated[ApplicationContext, Depends(get_context)]):
    return json_safe(ForecastingService(context).scenario_presets())


@router.get("/scenario-controls", response_model=list[ScenarioControl])
def scenario_controls(context: Annotated[ApplicationContext, Depends(get_context)]):
    return json_safe(ForecastingService(context).scenario_controls())


@router.post("/scenarios/simulate")
def simulate_scenario(
    payload: ScenarioSimulationRequest,
    context: Annotated[ApplicationContext, Depends(get_context)],
):
    variables = payload.variables.model_dump() if payload.variables is not None else None
    return json_safe(
        ForecastingService(context).simulate_scenario(
            model_name=payload.model,
            horizon=payload.horizon,
            scenario_key=payload.scenarioKey,
            variables=variables,
        )
    )


@router.get("/macro-variables", response_model=list[MacroVariable])
def macro_variables(context: Annotated[ApplicationContext, Depends(get_context)]):
    return json_safe(AnalyticsService(context).macro_variables())


@router.get("/target-variable", response_model=MacroVariable)
def target_variable(context: Annotated[ApplicationContext, Depends(get_context)]):
    return json_safe(AnalyticsService(context).target_variable())


@router.get("/correlation-matrix", response_model=CorrelationMatrix)
def correlation_matrix(context: Annotated[ApplicationContext, Depends(get_context)]):
    return json_safe(AnalyticsService(context).correlation_matrix())


@router.get("/acf", response_model=LagResponse)
def acf_values(
    context: Annotated[ApplicationContext, Depends(get_context)],
    variable: str = Query(..., min_length=1),
    nlags: int = Query(12, ge=1, le=36),
):
    return json_safe(AnalyticsService(context).acf_values(variable, nlags))


@router.get("/lag-correlations", response_model=LagResponse)
def lag_correlations(
    context: Annotated[ApplicationContext, Depends(get_context)],
    variable: str = Query(..., min_length=1),
    nlags: int = Query(12, ge=1, le=36),
):
    return json_safe(AnalyticsService(context).lag_correlations(variable, nlags))
