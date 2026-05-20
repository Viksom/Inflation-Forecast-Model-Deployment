from __future__ import annotations

import sys
from dataclasses import dataclass
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.core.model_registry import MODEL_REGISTRY
from app.core.settings import APP_DIR, OUTLIER_PREPROCESSOR_PATH
from app.models.compat import InflationModel
from app.utils.features import validate_feature_reference


@dataclass
class LoadedModel:
    name: str
    type: str
    scenario: bool
    artifact: Any


class ArimaAdapter:
    explainability_: list[dict[str, float | str]] = []

    def __init__(self, artifact: dict[str, Any]):
        self.artifact = artifact

    def predict(self, steps: int) -> np.ndarray:
        return self.forecast(steps)

    def forecast(self, steps: int) -> np.ndarray:
        return np.asarray(self.artifact["model"].forecast(steps=steps), dtype=float)

    def historical_predictions(self, index: pd.DatetimeIndex) -> pd.Series:
        fitted = pd.Series(self.artifact["model"].fittedvalues)
        return fitted.reindex(index)


class CCVarAdapter:
    explainability_: list[dict[str, float | str]] = []

    def __init__(self, artifact: dict[str, Any]):
        self.artifact = artifact

    def predict(self, steps: int) -> np.ndarray:
        return self.forecast(steps)

    def forecast(self, steps: int) -> np.ndarray:
        raw = np.asarray(self.artifact["model"].forecast(self.artifact["last_y"], steps=steps), dtype=float)
        target_deltas = raw[:, 0]
        anchor = float(self.artifact["anchor_value"])
        return anchor + np.cumsum(target_deltas)

    def historical_predictions(self, actual: pd.Series) -> pd.Series:
        fitted_deltas = self.artifact["model"].fittedvalues.iloc[:, 0]
        previous_actual = actual.shift(1).reindex(fitted_deltas.index)
        return (previous_actual + fitted_deltas).reindex(actual.index)


def _install_pickle_compat_class() -> None:
    setattr(sys.modules["__main__"], "InflationModel", InflationModel)


def _validate_ml_model_features(
    model_name: str,
    model: Any,
    *,
    raw_columns: set[str],
    feature_map: dict[str, str],
) -> None:
    if not hasattr(model, "predict") or not hasattr(model, "forecast") or not hasattr(model, "explainability_"):
        raise ValueError(f"{model_name} does not expose predict(), forecast(), and explainability_")

    feature_names = list(getattr(model, "feature_names_", []))
    if not feature_names:
        raise ValueError(f"{model_name} is missing feature_names_")

    for feature_name in feature_names:
        validate_feature_reference(
            feature_name,
            raw_columns=raw_columns,
            feature_map=feature_map,
            require_label=True,
        )


def load_preprocessor() -> Any:
    return joblib.load(OUTLIER_PREPROCESSOR_PATH)


def load_models(*, raw_columns: set[str], feature_map: dict[str, str]) -> dict[str, LoadedModel]:
    # This import is intentionally before any model pickle load, per the project boot rule.
    from app.models import FinalPipeline  # noqa: F401

    _install_pickle_compat_class()

    loaded: dict[str, LoadedModel] = {}
    for name, config in MODEL_REGISTRY.items():
        path = APP_DIR / config["path"]
        artifact = joblib.load(path)

        if name == "ARIMA":
            artifact = ArimaAdapter(artifact)
        elif name == "CC-VAR":
            artifact = CCVarAdapter(artifact)
        elif config["type"] == "ml":
            _validate_ml_model_features(name, artifact, raw_columns=raw_columns, feature_map=feature_map)

        if not hasattr(artifact, "predict") or not hasattr(artifact, "forecast") or not hasattr(artifact, "explainability_"):
            raise ValueError(f"{name} does not expose predict(), forecast(), and explainability_")

        loaded[name] = LoadedModel(
            name=name,
            type=config["type"],
            scenario=bool(config.get("scenario", False)),
            artifact=artifact,
        )

    return loaded

