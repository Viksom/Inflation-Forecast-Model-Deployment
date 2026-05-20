from pathlib import Path
import os


APP_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = APP_DIR.parent

CONFIG_DIR = APP_DIR / "config"
DATA_DIR = APP_DIR / "data"
RAW_DATA_PATH = DATA_DIR / "raw" / "inflation.csv"
MODELS_DIR = APP_DIR / "models"

FEATURE_MAP_PATH = CONFIG_DIR / "feature_map.json"
SCENARIO_PRESETS_PATH = CONFIG_DIR / "scenario_presets.json"
MODEL_METRICS_PATH = CONFIG_DIR / "model_metrics.json"
VARIABLE_SETS_PATH = CONFIG_DIR / "variable_sets.json"
OUTLIER_PREPROCESSOR_PATH = MODELS_DIR / "processors" / "standardize_features.pkl"

TARGET_COL = "inflation_target"
FUTURE_START = "2025-11-01"
HORIZON_MAP = {"1M": 1, "3M": 3, "12M": 12}

SCENARIO_OVERRIDE_MAP = {
    "hicp": "HICPOV_PT_ea-md",
    "core_inflation": "HICPNG_PT_ea-md",
    "ppi": "PPIPT_ppi",
    "epu": "epu_pt_epu",
    "consumer_confidence": "CCI_PT_ea-md",
}

MODEL_FIELD_MAP = {
    "ARIMA": "arima",
    "CC-VAR": "ccvar",
    "Ridge": "ridge",
    "LightGBM": "lgbm",
}

ML_MODELS = {"Ridge", "LightGBM"}
CLASSICAL_MODELS = {"ARIMA", "CC-VAR"}

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
