import pandas as pd

from app.core.settings import RAW_DATA_PATH


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

