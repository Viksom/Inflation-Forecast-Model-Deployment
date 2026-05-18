from dataclasses import dataclass
from typing import Any

import pandas as pd


@dataclass
class ApplicationContext:
    raw_data: pd.DataFrame
    feature_map: dict[str, str]
    scenario_presets: dict[str, Any]
    model_metrics: dict[str, dict[str, float]]
    variable_sets: dict[str, list[str]]
    models: dict[str, Any]
    preprocessor: Any

