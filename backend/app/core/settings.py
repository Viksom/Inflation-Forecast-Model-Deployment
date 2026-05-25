from pathlib import Path
import os


APP_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = APP_DIR.parent

CONFIG_DIR = APP_DIR / "config"
DATA_DIR = APP_DIR / "data"
RAW_DATA_PATH = DATA_DIR / "raw" / "inflation.csv"
CURRENT_INFLATION_PATH = DATA_DIR / "Current_Inflation.csv"
MODELS_DIR = APP_DIR / "models"

FEATURE_MAP_PATH = CONFIG_DIR / "feature_map.json"
SCENARIO_PRESETS_PATH = CONFIG_DIR / "scenario_presets.json"
MODEL_METRICS_PATH = CONFIG_DIR / "model_metrics.json"
VARIABLE_SETS_PATH = CONFIG_DIR / "variable_sets.json"
OUTLIER_PREPROCESSOR_PATH = MODELS_DIR / "processors" / "standardize_features.pkl"

TARGET_COL = "inflation_target"
FUTURE_START = "2025-11-01"
HORIZON_MAP = {"1M": 1, "3M": 3, "12M": 12}

SCENARIO_MODEL_CONFIG = {
    "Ridge": {
        "controls": [
            {"key": "hicp", "feature": "HICPOV_PT_ea-md", "min": -5, "max": 5, "step": 0.1, "decimals": 1},
            {"key": "coreInflation", "feature": "HICPNG_PT_ea-md", "min": -3, "max": 3, "step": 0.1, "decimals": 1},
            {"key": "ppi", "feature": "PPIPT_ppi", "min": -10, "max": 10, "step": 0.5, "decimals": 1},
            {"key": "epu", "feature": "epu_pt_epu", "min": -50, "max": 50, "step": 1, "decimals": 0},
            {"key": "consumerConfidence", "feature": "CCI_PT_ea-md", "min": -20, "max": 20, "step": 1, "decimals": 0},
        ],
    },
    "LightGBM": {
        "controls": [
            {"key": "epu", "feature": "epu_pt_epu", "min": -50, "max": 50, "step": 1, "decimals": 0},
            {"key": "ulc", "feature": "ULCIN_PT_ea-qd", "min": -5, "max": 5, "step": 0.1, "decimals": 1},
            {"key": "exports", "feature": "EXPGS_PT_ea-qd", "min": -10, "max": 10, "step": 0.5, "decimals": 1},
            {"key": "imports", "feature": "IMPGS_PT_ea-qd", "min": -10, "max": 10, "step": 0.5, "decimals": 1},
            {"key": "consumerConfidence", "feature": "CCI_PT_ea-md", "min": -20, "max": 20, "step": 1, "decimals": 0},
            {"key": "gdp", "feature": "GDP_PT_ea-qd", "min": -10, "max": 10, "step": 0.5, "decimals": 1},
            {"key": "unemployment", "feature": "UNETOT_PT_ea-md", "min": -3, "max": 3, "step": 0.1, "decimals": 1},
            {"key": "ppi", "feature": "PPIPT_ppi", "min": -10, "max": 10, "step": 0.5, "decimals": 1},
        ],
    },
}

MODEL_FIELD_MAP = {
    "ARIMA": "arima",
    "CC-VAR": "ccvar",
    "Ridge": "ridge",
    "LightGBM": "lgbm",
}

ML_MODELS = {"Ridge", "LightGBM"}
CLASSICAL_MODELS = {"ARIMA", "CC-VAR"}
VARIABLE_SET_KEY_BY_MODEL = {
    "ARIMA": "Ridge_features",
    "CC-VAR": "Ridge_features",
    "Ridge": "Ridge_features",
    "LightGBM": "LightGBM_features",
}

NAIVE_BASELINE_RMSE = 0.52
NAIVE_BASELINE_MAE = 0.39

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip()
]
ALLOWED_ORIGIN_REGEX = os.getenv(
    "ALLOWED_ORIGIN_REGEX",
    r"http://(localhost|127\.0\.0\.1):\d+|https://.*\.netlify\.app",
)
