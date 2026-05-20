import json
from pathlib import Path
from typing import Any

import pandas as pd

from app.core.settings import (
    FEATURE_MAP_PATH,
    MODEL_METRICS_PATH,
    SCENARIO_OVERRIDE_MAP,
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

    for abstract_key, feature_name in SCENARIO_OVERRIDE_MAP.items():
        if feature_name not in feature_map:
            raise ValueError(f"SCENARIO_OVERRIDE_MAP[{abstract_key}] is missing from feature_map.json")
        if feature_name not in raw_columns:
            raise ValueError(f"SCENARIO_OVERRIDE_MAP[{abstract_key}] references missing column {feature_name}")

    for scenario_name, scenario in scenario_presets.items():
        shocks = scenario.get("shocks", {})
        if not isinstance(shocks, dict):
            raise ValueError(f"Scenario {scenario_name} must define shocks as an object")
        for feature_name, shock in shocks.items():
            validate_feature_reference(
                feature_name,
                raw_columns=raw_columns,
                feature_map=feature_map,
                require_label=True,
            )
            if not isinstance(shock, (int, float)):
                raise ValueError(f"Scenario {scenario_name} shock for {feature_name} must be numeric")

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

