from __future__ import annotations

from math import sqrt
from typing import Any

import numpy as np
import pandas as pd
from fastapi import HTTPException

from app.core.settings import (
    FUTURE_START,
    HORIZON_MAP,
    ML_MODELS,
    MODEL_FIELD_MAP,
    NAIVE_BASELINE_MAE,
    NAIVE_BASELINE_RMSE,
    SCENARIO_OVERRIDE_MAP,
    TARGET_COL,
)
from app.services.context import ApplicationContext
from app.utils.features import parse_feature_name, translate_feature
from app.utils.json import finite_float


PREPARED_COLUMNS = [
    "PCEPI_fred-md",
    "HICPOV_PT_ea-md",
    "HICPNG_PT_ea-md",
    "HICPSV_PT_ea-md",
    "EXPGS_PT_ea-qd",
    "PPIPT_ppi",
    "epu_pt_epu",
    "HICPNEF_PT_ea-md",
    "CCI_PT_ea-md",
    TARGET_COL,
]

SCENARIO_FRONTEND_FIELD_MAP = {
    "hicp": "hicp",
    "core_inflation": "coreInflation",
    "ppi": "ppi",
    "epu": "epu",
    "consumer_confidence": "consumerConfidence",
}

SCENARIO_CONTROL_SPECS = [
    {"abstract_key": "hicp", "key": "hicp", "min": -5, "max": 5, "step": 0.1, "decimals": 1},
    {"abstract_key": "core_inflation", "key": "coreInflation", "min": -3, "max": 3, "step": 0.1, "decimals": 1},
    {"abstract_key": "ppi", "key": "ppi", "min": -10, "max": 10, "step": 0.5, "decimals": 1},
    {"abstract_key": "epu", "key": "epu", "min": -50, "max": 50, "step": 1, "decimals": 0},
    {"abstract_key": "consumer_confidence", "key": "consumerConfidence", "min": -20, "max": 20, "step": 1, "decimals": 0},
]


class ForecastingService:
    def __init__(self, context: ApplicationContext):
        self.context = context

    def horizon_steps(self, horizon: str) -> int:
        try:
            return HORIZON_MAP[horizon]
        except KeyError as exc:
            raise HTTPException(status_code=422, detail=f"Invalid horizon: {horizon}") from exc

    def build_future_data(self, steps: int, shocks: dict[str, float] | None = None) -> pd.DataFrame:
        future_index = pd.date_range(FUTURE_START, periods=steps, freq="MS")
        future = pd.DataFrame(index=future_index, columns=self.context.raw_data.columns, dtype=float)

        for column in self.context.raw_data.columns:
            last_valid = self.context.raw_data[column].dropna()
            future[column] = float(last_valid.iloc[-1]) if not last_valid.empty else np.nan

        future[TARGET_COL] = 0.0

        for feature_name, shock in (shocks or {}).items():
            if feature_name not in future.columns:
                raise HTTPException(status_code=422, detail=f"Invalid scenario variable: {feature_name}")
            if feature_name == TARGET_COL:
                raise HTTPException(status_code=422, detail="Scenarios cannot shock inflation_target")
            future[feature_name] = future[feature_name].astype(float) + float(shock)

        self._validate_future_data(future)
        return future

    def inflation_series(self, *, horizon: str = "3M", selected_model: str = "LightGBM") -> list[dict[str, Any]]:
        if selected_model not in self.context.models:
            raise HTTPException(status_code=404, detail=f"Model not found: {selected_model}")

        steps = self.horizon_steps(horizon)
        future_data = self.build_future_data(steps)
        history_start = pd.Timestamp("2018-01-01")
        history_index = self.context.raw_data.loc[history_start:].index
        future_index = future_data.index
        output_end = future_index.max()
        actual_history_index = self.context.current_inflation.loc[history_start:output_end].index
        output_index = actual_history_index.union(future_index).sort_values()

        predictions = self._all_model_predictions(future_data=future_data, history_index=history_index)
        actual = self.context.current_inflation.reindex(output_index)
        actual_by_date = {
            index.strftime("%Y-%m"): finite_float(value)
            for index, value in actual.items()
        }

        mae = self.context.model_metrics.get(selected_model, {}).get("mae")
        selected_field = MODEL_FIELD_MAP[selected_model]
        include_interval = selected_model in ML_MODELS and mae is not None

        records: list[dict[str, Any]] = []
        for date_value in output_index:
            date_key = date_value.strftime("%Y-%m")
            record: dict[str, Any] = {
                "date": date_key,
                "actual": actual_by_date.get(date_key),
            }
            for model_name, field_name in MODEL_FIELD_MAP.items():
                record[field_name] = finite_float(predictions[model_name].get(date_value))

            selected_prediction = record.get(selected_field)
            if include_interval and selected_prediction is not None:
                record["confidenceLow"] = float(selected_prediction) - float(mae)
                record["confidenceHigh"] = float(selected_prediction) + float(mae)
            else:
                record["confidenceLow"] = None
                record["confidenceHigh"] = None

            records.append(record)

        return records

    def model_metrics(self) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for model_name, loaded in self.context.models.items():
            metrics = self.context.model_metrics[model_name]
            category = "Machine Learning" if loaded.type == "ml" else "Classical"
            scenario = "Yes" if model_name == "LightGBM" else "Partial" if model_name == "Ridge" else "No"
            result.append(
                {
                    "model": model_name,
                    "rmse": float(metrics["rmse"]),
                    "mae": float(metrics["mae"]),
                    "rrmse": float(metrics["rmse"]) / NAIVE_BASELINE_RMSE,
                    "rmae": float(metrics["mae"]) / NAIVE_BASELINE_MAE,
                    "category": category,
                    "scenarioCompatible": scenario,
                }
            )
        return result

    def feature_importance(self, model_name: str) -> list[dict[str, Any]]:
        if model_name not in self.context.models:
            raise HTTPException(status_code=404, detail=f"Model not found: {model_name}")
        if model_name not in ML_MODELS:
            raise HTTPException(status_code=422, detail="Feature importance is available only for ML models")

        artifact = self.context.models[model_name].artifact
        result = []
        for item in artifact.explainability_:
            result.append(
                {
                    "variable": translate_feature(str(item["variable"]), self.context.feature_map),
                    "importance": float(item["importance"]),
                    "model": model_name,
                }
            )
        return result

    def scenario_presets(self) -> list[dict[str, Any]]:
        presets = []
        for key, preset in self.context.scenario_presets.items():
            presets.append(
                {
                    "key": key,
                    "label": key,
                    "description": preset.get("description", ""),
                    "values": self._shocks_to_frontend_values(preset.get("shocks", {})),
                }
            )
        return presets

    def scenario_controls(self) -> list[dict[str, Any]]:
        controls = []
        for spec in SCENARIO_CONTROL_SPECS:
            feature_name = SCENARIO_OVERRIDE_MAP[spec["abstract_key"]]
            controls.append(
                {
                    "key": spec["key"],
                    "label": translate_feature(feature_name, self.context.feature_map),
                    "min": spec["min"],
                    "max": spec["max"],
                    "step": spec["step"],
                    "decimals": spec["decimals"],
                }
            )
        return controls

    def simulate_scenario(
        self,
        *,
        model_name: str,
        horizon: str,
        scenario_key: str,
        variables: dict[str, float] | None,
    ) -> dict[str, Any]:
        if model_name not in self.context.models:
            raise HTTPException(status_code=404, detail=f"Model not found: {model_name}")
        if model_name not in ML_MODELS:
            raise HTTPException(status_code=422, detail="ARIMA/CC-VAR models do not support scenario requests")

        steps = self.horizon_steps(horizon)
        shocks = self._resolve_scenario_shocks(scenario_key=scenario_key, variables=variables)
        baseline_future = self.build_future_data(steps)
        scenario_future = self.build_future_data(steps, shocks=shocks)

        baseline_forecast = self._forecast_ml_future(model_name, baseline_future)
        scenario_forecast = self._forecast_ml_future(model_name, scenario_future)
        history = self._historical_predictions(model_name).dropna().tail(12)

        baseline_series = self._series_records(pd.concat([history, baseline_forecast]))
        scenario_series = self._series_records(pd.concat([history, scenario_forecast]))

        delta = float(scenario_forecast.iloc[-1] - baseline_forecast.iloc[-1])
        peak_date = scenario_forecast.idxmax().strftime("%Y-%m")
        rmse = sqrt(float(np.mean(np.square(scenario_forecast.values - baseline_forecast.values))))

        return {
            "model": model_name,
            "baselineSeries": baseline_series,
            "scenarioSeries": scenario_series,
            "delta": delta,
            "peakDate": peak_date,
            "robustnessEstimate": rmse,
            "driverImpact": [
                {
                    "label": translate_feature(feature_name, self.context.feature_map),
                    "value": float(value),
                }
                for feature_name, value in shocks.items()
            ],
        }

    def _all_model_predictions(
        self,
        *,
        future_data: pd.DataFrame,
        history_index: pd.DatetimeIndex,
    ) -> dict[str, pd.Series]:
        predictions: dict[str, pd.Series] = {}
        for model_name in self.context.models:
            historical = self._historical_predictions(model_name).reindex(history_index)
            future = self._forecast_future(model_name, future_data)
            predictions[model_name] = pd.concat([historical, future])
        return predictions

    def _historical_predictions(self, model_name: str) -> pd.Series:
        loaded = self.context.models[model_name]
        if model_name == "ARIMA":
            return loaded.artifact.historical_predictions(self.context.raw_data.index)
        if model_name == "CC-VAR":
            return loaded.artifact.historical_predictions(self.context.raw_data[TARGET_COL])

        feature_frame = self._build_ml_feature_frame(self.context.raw_data, loaded.artifact.feature_names_)
        values = loaded.artifact.predict(feature_frame)
        return pd.Series(values, index=feature_frame.index, name=model_name)

    def _forecast_future(self, model_name: str, future_data: pd.DataFrame) -> pd.Series:
        loaded = self.context.models[model_name]
        if model_name in ML_MODELS:
            return self._forecast_ml_future(model_name, future_data)
        values = loaded.artifact.forecast(len(future_data))
        return pd.Series(values, index=future_data.index, name=model_name)

    def _forecast_ml_future(self, model_name: str, future_data: pd.DataFrame) -> pd.Series:
        loaded = self.context.models[model_name]
        combined = pd.concat([self.context.raw_data, future_data], axis=0)
        prepared = self._prepared_ml_panel(combined)
        target_series = prepared[TARGET_COL].copy()

        predictions: list[float] = []
        for date_value in future_data.index:
            feature_frame = self._build_ml_feature_frame(
                combined,
                loaded.artifact.feature_names_,
                prepared_panel=prepared,
                target_series=target_series,
            )
            row = feature_frame.loc[[date_value]]
            prediction = float(loaded.artifact.forecast(row, steps=1)[0])
            predictions.append(prediction)
            target_series.loc[date_value] = prediction

        return pd.Series(predictions, index=future_data.index, name=model_name)

    def _build_ml_feature_frame(
        self,
        panel: pd.DataFrame,
        feature_names: list[str] | pd.Index,
        *,
        prepared_panel: pd.DataFrame | None = None,
        target_series: pd.Series | None = None,
    ) -> pd.DataFrame:
        prepared = prepared_panel if prepared_panel is not None else self._prepared_ml_panel(panel)
        target_values = target_series if target_series is not None else prepared[TARGET_COL]
        feature_frame = pd.DataFrame(index=prepared.index)

        for feature_name in list(feature_names):
            ref = parse_feature_name(feature_name)
            if ref.base_name == TARGET_COL and not ref.is_lagged:
                raise HTTPException(status_code=422, detail="inflation_target cannot be used as an unlagged predictor")

            if ref.is_lagged:
                source = target_values if ref.base_name == TARGET_COL else prepared[ref.base_name]
                feature_frame[feature_name] = source.shift(ref.lag)
            else:
                feature_frame[feature_name] = prepared[feature_name]

        return feature_frame.ffill().bfill()

    def _prepared_ml_panel(self, panel: pd.DataFrame) -> pd.DataFrame:
        input_columns = list(self.context.preprocessor.feature_names_in_)
        missing = [column for column in input_columns if column not in panel.columns]
        if missing:
            raise HTTPException(status_code=500, detail=f"Missing model input columns: {missing}")

        levels = panel[input_columns].copy()
        levels = levels.interpolate(method="linear", limit_direction="both").ffill().bfill()
        transformed = self.context.preprocessor.transform(levels)
        return pd.DataFrame(transformed, index=levels.index, columns=PREPARED_COLUMNS)

    def _resolve_scenario_shocks(self, *, scenario_key: str, variables: dict[str, float] | None) -> dict[str, float]:
        if variables is not None:
            return self._frontend_values_to_shocks(variables)

        if scenario_key == "Custom":
            return self._frontend_values_to_shocks({})

        if scenario_key not in self.context.scenario_presets:
            raise HTTPException(status_code=422, detail=f"Invalid scenario: {scenario_key}")

        return {
            str(feature_name): float(value)
            for feature_name, value in self.context.scenario_presets[scenario_key].get("shocks", {}).items()
        }

    def _frontend_values_to_shocks(self, values: dict[str, float]) -> dict[str, float]:
        shocks = {}
        reverse_field_map = {frontend_key: abstract_key for abstract_key, frontend_key in SCENARIO_FRONTEND_FIELD_MAP.items()}
        for frontend_key, abstract_key in reverse_field_map.items():
            feature_name = SCENARIO_OVERRIDE_MAP[abstract_key]
            shocks[feature_name] = float(values.get(frontend_key, 0.0))
        return shocks

    def _shocks_to_frontend_values(self, shocks: dict[str, float]) -> dict[str, float]:
        reverse_map = {feature_name: key for key, feature_name in SCENARIO_OVERRIDE_MAP.items()}
        values = {frontend_name: 0.0 for frontend_name in SCENARIO_FRONTEND_FIELD_MAP.values()}
        for feature_name, shock in shocks.items():
            abstract_key = reverse_map.get(feature_name)
            if abstract_key is None:
                continue
            values[SCENARIO_FRONTEND_FIELD_MAP[abstract_key]] = float(shock)
        return values

    def _series_records(self, series: pd.Series) -> list[dict[str, float | str | None]]:
        return [
            {"date": index.strftime("%Y-%m"), "value": finite_float(value)}
            for index, value in series.items()
        ]

    def _validate_future_data(self, future_data: pd.DataFrame) -> None:
        expected_index = pd.date_range(FUTURE_START, periods=len(future_data), freq="MS")
        if not isinstance(future_data.index, pd.DatetimeIndex):
            raise HTTPException(status_code=500, detail="future_data must use a DateTimeIndex")
        if not future_data.index.equals(expected_index):
            raise HTTPException(status_code=500, detail="future_data must start at 2025-11-01 with MS frequency")
        if TARGET_COL not in future_data.columns:
            raise HTTPException(status_code=500, detail="future_data must include inflation_target")
        if not (future_data[TARGET_COL].fillna(1.0) == 0.0).all():
            raise HTTPException(status_code=500, detail="future_data inflation_target must be zero")
