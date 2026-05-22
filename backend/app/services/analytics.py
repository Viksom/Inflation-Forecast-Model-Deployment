from __future__ import annotations

from typing import Any

import pandas as pd
from fastapi import HTTPException
from statsmodels.tsa.stattools import acf

from app.core.settings import TARGET_COL
from app.services.context import ApplicationContext
from app.utils.features import translate_feature
from app.utils.json import finite_float

VARIABLE_EXPLORER_KEYS = [
    "HICPOV_PT_ea-md",
    "HICPNG_PT_ea-md",
    "HICPNEF_PT_ea-md",
    "PPIPT_ppi",
    "epu_pt_epu",
    "CCI_PT_ea-md",
    "PCEPI_fred-md",
    "EXPGS_PT_ea-qd",
]

VARIABLE_METADATA = {
    "HICPOV_PT_ea-md": {"unit": "Index", "source": "Eurostat"},
    "HICPNG_PT_ea-md": {"unit": "Index", "source": "Eurostat"},
    "HICPNEF_PT_ea-md": {"unit": "Index", "source": "Eurostat"},
    "PPIPT_ppi": {"unit": "Index", "source": "Banco de Portugal"},
    "epu_pt_epu": {"unit": "Index", "source": "EPU Portugal"},
    "CCI_PT_ea-md": {"unit": "Index", "source": "OECD"},
    "PCEPI_fred-md": {"unit": "Index", "source": "FRED"},
    "EXPGS_PT_ea-qd": {"unit": "Index", "source": "Eurostat"},
}

TARGET_METADATA = {"unit": "%", "source": "Inflation Target"}

CORRELATION_KEYS = [
    "HICPOV_PT_ea-md",
    "HICPNG_PT_ea-md",
    "PPIPT_ppi",
    "epu_pt_epu",
    "CCI_PT_ea-md",
]


class AnalyticsService:
    def __init__(self, context: ApplicationContext):
        self.context = context

    def current_inflation(self) -> list[dict[str, Any]]:
        series = self.context.current_inflation.astype(float)
        return [
            {"date": index.strftime("%Y-%m"), "value": finite_float(value)}
            for index, value in series.items()
        ]

    def macro_variables(self) -> list[dict[str, Any]]:
        variables = []
        for key in VARIABLE_EXPLORER_KEYS:
            series = self._filled_series(key)
            metadata = VARIABLE_METADATA[key]
            variables.append(
                {
                    "name": translate_feature(key, self.context.feature_map),
                    "series": [
                        {"date": index.strftime("%Y-%m"), "value": finite_float(value)}
                        for index, value in series.items()
                    ],
                    "unit": metadata["unit"],
                    "source": metadata["source"],
                }
            )
        return variables

    def target_variable(self) -> dict[str, Any]:
        series = self._filled_series(TARGET_COL)
        return {
            "name": translate_feature(TARGET_COL, self.context.feature_map),
            "series": [
                {"date": index.strftime("%Y-%m"), "value": finite_float(value)}
                for index, value in series.items()
            ],
            "unit": TARGET_METADATA["unit"],
            "source": TARGET_METADATA["source"],
        }

    def correlation_matrix(self) -> dict[str, Any]:
        frame = pd.DataFrame({key: self._filled_series(key) for key in CORRELATION_KEYS})
        corr = frame.corr().reindex(index=CORRELATION_KEYS, columns=CORRELATION_KEYS)
        return {
            "labels": [translate_feature(key, self.context.feature_map) for key in CORRELATION_KEYS],
            "values": [
                [finite_float(value) for value in row]
                for row in corr.to_numpy(dtype=float)
            ],
        }

    def acf_values(self, variable: str, nlags: int = 12) -> dict[str, Any]:
        key = self._resolve_variable(variable)
        if nlags < 1 or nlags > 36:
            raise HTTPException(status_code=422, detail="nlags must be between 1 and 36")

        series = self.context.raw_data[key].dropna().astype(float)
        if series.empty:
            raise HTTPException(status_code=422, detail=f"Variable has no historical observations: {variable}")

        values = acf(series, nlags=nlags, missing="drop", fft=False)
        return {
            "variable": translate_feature(key, self.context.feature_map),
            "values": [
                {"lag": lag, "value": finite_float(values[lag])}
                for lag in range(1, nlags + 1)
            ],
        }

    def lag_correlations(self, variable: str, nlags: int = 12) -> dict[str, Any]:
        return self.acf_values(variable, nlags)

    def _resolve_variable(self, variable: str) -> str:
        if variable in self.context.raw_data.columns:
            return variable

        reverse_map = {label: key for key, label in self.context.feature_map.items()}
        try:
            return reverse_map[variable]
        except KeyError as exc:
            raise HTTPException(status_code=422, detail=f"Invalid variable: {variable}") from exc

    def _filled_series(self, key: str) -> pd.Series:
        if key not in self.context.raw_data.columns:
            raise HTTPException(status_code=422, detail=f"Invalid variable: {key}")
        return (
            self.context.raw_data[key]
            .astype(float)
            .interpolate(method="linear", limit_direction="both")
            .ffill()
            .bfill()
        )

