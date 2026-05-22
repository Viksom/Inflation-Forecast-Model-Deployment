import pandas as pd

from app.core.settings import CURRENT_INFLATION_PATH, RAW_DATA_PATH


def load_raw_data() -> pd.DataFrame:
    data = pd.read_csv(RAW_DATA_PATH, parse_dates=["Date"])
    if "Date" not in data.columns:
        raise ValueError("inflation.csv must contain a Date column")

    data = data.set_index("Date").sort_index()
    if not isinstance(data.index, pd.DatetimeIndex):
        raise ValueError("inflation.csv Date column must parse as datetime")
    if data.index.has_duplicates:
        raise ValueError("inflation.csv contains duplicated dates")
    if data.empty:
        raise ValueError("inflation.csv is empty")

    return data


def load_current_inflation() -> pd.Series:
    data = pd.read_csv(CURRENT_INFLATION_PATH, parse_dates=["Date"])
    if "Date" not in data.columns or "inflation_target" not in data.columns:
        raise ValueError("Current_Inflation.csv must contain Date and inflation_target columns")

    data = data.set_index("Date").sort_index()
    if not isinstance(data.index, pd.DatetimeIndex):
        raise ValueError("Current_Inflation.csv Date column must parse as datetime")
    if data.index.has_duplicates:
        raise ValueError("Current_Inflation.csv contains duplicated dates")
    if data.empty:
        raise ValueError("Current_Inflation.csv is empty")

    return data["inflation_target"].astype(float)

