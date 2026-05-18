from __future__ import annotations

from functools import cached_property
from typing import Any

import numpy as np
import pandas as pd


class InflationModel:
    """Compatibility class for ML pickles saved from a __main__ session."""

    def _estimator(self) -> Any:
        return getattr(self, "model_", getattr(self, "model", None))

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        estimator = self._estimator()
        if estimator is None:
            raise ValueError("Loaded ML model does not contain a fitted estimator")
        return np.asarray(estimator.predict(features), dtype=float)

    def forecast(self, features: pd.DataFrame, steps: int | None = None) -> np.ndarray:
        frame = features if steps is None else features.iloc[:steps]
        return self.predict(frame)

    @cached_property
    def explainability_(self) -> list[dict[str, float | str]]:
        estimator = self._estimator()
        feature_names = list(getattr(self, "feature_names_", []))

        if estimator is None or not feature_names:
            return []

        if hasattr(estimator, "coef_"):
            raw_values = np.asarray(estimator.coef_, dtype=float).ravel()
        elif hasattr(estimator, "feature_importances_"):
            raw_values = np.asarray(estimator.feature_importances_, dtype=float).ravel()
        else:
            raw_values = np.zeros(len(feature_names), dtype=float)

        if len(raw_values) != len(feature_names):
            raw_values = raw_values[: len(feature_names)]

        scale = float(np.nanmax(np.abs(raw_values))) if raw_values.size else 0.0
        if not np.isfinite(scale) or scale == 0.0:
            normalized = np.zeros_like(raw_values, dtype=float)
        else:
            normalized = raw_values / scale

        return [
            {"variable": name, "importance": float(value)}
            for name, value in zip(feature_names, normalized, strict=False)
        ]

