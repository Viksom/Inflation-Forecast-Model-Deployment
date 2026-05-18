from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ModelKey = Literal["ARIMA", "VAR", "Ridge", "LightGBM"]
MlModelKey = Literal["Ridge", "LightGBM"]
HorizonKey = Literal["1M", "3M", "12M"]
ScenarioKey = Literal["Baseline", "Optimistic", "Pessimistic", "Energy Shock", "Monetary Tightening", "Custom"]


class ScenarioVariables(BaseModel):
    model_config = ConfigDict(extra="forbid")

    hicp: float = 0.0
    coreInflation: float = 0.0
    ppi: float = 0.0
    epu: float = 0.0
    consumerConfidence: float = 0.0


class ScenarioSimulationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    model: str
    horizon: HorizonKey = "3M"
    scenarioKey: ScenarioKey = "Custom"
    variables: ScenarioVariables | None = None


class InflationDataPoint(BaseModel):
    date: str
    actual: float | None
    arima: float | None
    var: float | None
    ridge: float | None
    lgbm: float | None
    confidenceLow: float | None
    confidenceHigh: float | None


class ModelMetrics(BaseModel):
    model: ModelKey
    rmse: float
    mae: float
    rrmse: float
    rmae: float
    category: Literal["Classical", "Machine Learning"]
    scenarioCompatible: Literal["Yes", "Partial", "No"]


class FeatureImportance(BaseModel):
    variable: str
    importance: float
    model: MlModelKey


class ScenarioPreset(BaseModel):
    key: ScenarioKey
    label: str
    description: str
    values: ScenarioVariables


class SeriesPoint(BaseModel):
    date: str
    value: float | None


class MacroVariable(BaseModel):
    name: str
    series: list[SeriesPoint]
    unit: str
    source: str


class CorrelationMatrix(BaseModel):
    labels: list[str]
    values: list[list[float | None]]


class LagValue(BaseModel):
    lag: int = Field(ge=1)
    value: float | None


class LagResponse(BaseModel):
    variable: str
    values: list[LagValue]
