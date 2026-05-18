from __future__ import annotations

from collections.abc import Mapping, Sequence
from datetime import date, datetime
from math import isfinite
from typing import Any

import numpy as np
import pandas as pd


def json_safe(value: Any) -> Any:
    if value is None:
        return None

    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m")

    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m")

    if isinstance(value, np.generic):
        return json_safe(value.item())

    if isinstance(value, float):
        return value if isfinite(value) else None

    if isinstance(value, (int, str, bool)):
        return value

    if isinstance(value, pd.Series):
        return [json_safe(item) for item in value.tolist()]

    if isinstance(value, pd.DataFrame):
        return json_safe(value.to_dict(orient="records"))

    if isinstance(value, np.ndarray):
        return [json_safe(item) for item in value.tolist()]

    if isinstance(value, Mapping):
        return {str(key): json_safe(item) for key, item in value.items()}

    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return [json_safe(item) for item in value]

    return value


def finite_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if isfinite(result) else None

