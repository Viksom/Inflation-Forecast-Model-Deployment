import json
from pathlib import Path
from typing import Any

import pandas as pd

from app.core.settings import (
    FEATURE_MAP_PATH,
    MODEL_METRICS_PATH,
    SCENARIO_MODEL_CONFIG,
    SCENARIO_PRESETS_PATH,
    TARGET_COL,
    VARIABLE_SETS_PATH,
)
from app.utils.features import validate_feature_reference


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_configs() -> tuple[dict[str, str], dict[str, Any], dict[str, Any], dict[str, list[str]]]:
    feature_map = load_json(FEATURE_MAP_PATH)
    scenario_presets = load_json(SCENARIO_PRESETS_PATH)
    model_metrics = load_json(MODEL_METRICS_PATH)
    variable_sets = load_json(VARIABLE_SETS_PATH)
    return feature_map, scenario_presets, model_metrics, variable_sets


def validate_configs(
    *,
    raw_data: pd.DataFrame,
    feature_map: dict[str, str],
    scenario_presets: dict[str, Any],
    model_metrics: dict[str, Any],
    variable_sets: dict[str, list[str]],
) -> None:
    raw_columns = set(raw_data.columns)

    if TARGET_COL not in raw_columns:
        raise ValueError(f"{TARGET_COL} is missing from inflation.csv")

    for feature_name in feature_map:
        if feature_name not in raw_columns:
            raise ValueError(f"feature_map.json references missing column: {feature_name}")

    for model_name, config in SCENARIO_MODEL_CONFIG.items():
        for control in config.get("controls", []):
            feature_name = control["feature"]
            if feature_name not in feature_map:
                raise ValueError(f"Scenario control {control['key']} for {model_name} is missing from feature_map.json")
            if feature_name not in raw_columns:
                raise ValueError(f"Scenario control {control['key']} for {model_name} references missing column {feature_name}")

    for model_name, presets in scenario_presets.items():
        if model_name not in SCENARIO_MODEL_CONFIG:
            raise ValueError(f"scenario_presets.json references unsupported model: {model_name}")
        for scenario_name, scenario in presets.items():
            shocks = scenario.get("shocks", {})
            if not isinstance(shocks, dict):
                raise ValueError(f"Scenario {scenario_name} for {model_name} must define shocks as an object")
            for feature_name, shock in shocks.items():
                validate_feature_reference(
                    feature_name,
                    raw_columns=raw_columns,
                    feature_map=feature_map,
                    require_label=True,
                )
                if not isinstance(shock, (int, float)):
                    raise ValueError(f"Scenario {scenario_name} shock for {feature_name} in {model_name} must be numeric")

    for set_name, features in variable_sets.items():
        for feature_name in features:
            validate_feature_reference(
                feature_name,
                raw_columns=raw_columns,
                feature_map=feature_map,
                require_label=True,
            )

    expected_models = {"ARIMA", "CC-VAR", "Ridge", "LightGBM"}
    missing_metrics = expected_models.difference(model_metrics)
    if missing_metrics:
        raise ValueError(f"model_metrics.json is missing models: {sorted(missing_metrics)}")

