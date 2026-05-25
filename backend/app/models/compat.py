from __future__ import annotations

from functools import cached_property
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.core.settings import MODELS_DIR, OUTLIER_PREPROCESSOR_PATH
from app.utils.features import parse_feature_name


MODEL_PREPROCESSOR_PATHS = {
    "ridge": OUTLIER_PREPROCESSOR_PATH,
    "lgbm": MODELS_DIR / "processors" / "standardize_features_lgbm.pkl",
}


class InflationModel:
    """Compatibility class for ML pickles saved from a __main__ session."""

    def _estimator(self) -> Any:
        return getattr(self, "model_", getattr(self, "model", None))

    def predict(self, features: pd.DataFrame) -> np.ndarray:
        estimator = self._estimator()
        if estimator is None:
            raise ValueError("Loaded ML model does not contain a fitted estimator")
        prepared = self._prepare_predict_features(features)
        return np.asarray(estimator.predict(prepared), dtype=float)

    def forecast(self, features: pd.DataFrame, steps: int | None = None) -> np.ndarray:
        frame = features if steps is None else features.iloc[:steps]
        estimator = self._estimator()
        if estimator is None:
            raise ValueError("Loaded ML model does not contain a fitted estimator")
        return np.asarray(estimator.predict(frame), dtype=float)

    def _prepare_predict_features(self, features: pd.DataFrame) -> pd.DataFrame:
        feature_names = list(getattr(self, "feature_names_", []))
        if not feature_names:
            raise ValueError("Loaded ML model does not contain feature_names_")

        if all(feature_name in features.columns for feature_name in feature_names):
            return features.reindex(columns=feature_names).ffill().bfill()

        panel = features.copy()
        if "Date" in panel.columns:
            panel = panel.set_index("Date")

        train_data = getattr(self, "train_data_", None)
        if train_data is None:
            raise ValueError("Loaded ML model does not contain train_data_")

        target_col = getattr(self, "target_col", "inflation_target")
        base_columns = list(train_data.columns)
        missing_columns = [column for column in base_columns if column not in panel.columns]
        if missing_columns:
            raise ValueError(f"Missing required columns for predict(): {missing_columns}")

        prepared = panel.reindex(columns=base_columns).copy()
        prepared = prepared.interpolate(method="linear", limit_direction="both").ffill().bfill()

        if getattr(self, "treat_outliers", False):
            prepared = self._apply_outlier_preprocessor(prepared)

        target_values = prepared[target_col]
        feature_frame = pd.DataFrame(index=prepared.index)
        for feature_name in feature_names:
            ref = parse_feature_name(str(feature_name))
            if ref.is_lagged:
                source = target_values if ref.base_name == target_col else prepared[ref.base_name]
                feature_frame[feature_name] = source.shift(ref.lag)
            else:
                feature_frame[feature_name] = prepared[ref.base_name]

        return feature_frame.reindex(columns=feature_names).ffill().bfill()

    def _apply_outlier_preprocessor(self, prepared: pd.DataFrame) -> pd.DataFrame:
        model_type = str(getattr(self, "pipeline_model_type", "")).lower()
        preprocessor_path = MODEL_PREPROCESSOR_PATHS.get(model_type, OUTLIER_PREPROCESSOR_PATH)
        preprocessor = joblib.load(preprocessor_path)
        pre_columns = list(getattr(preprocessor, "feature_names_in_", []))
        if not pre_columns:
            return prepared

        pre_input = pd.DataFrame(index=prepared.index, columns=pre_columns, dtype=float)
        for column in pre_columns:
            pre_input[column] = prepared[column] if column in prepared.columns else np.nan

        pre_input = pre_input.interpolate(method="linear", limit_direction="both").ffill().bfill()
        transformed = pd.DataFrame(preprocessor.transform(pre_input), index=prepared.index, columns=pre_columns)

        updated = prepared.copy()
        for column in pre_columns:
            if column in updated.columns:
                updated[column] = transformed[column]

        return updated

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

