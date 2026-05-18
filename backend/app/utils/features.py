import re
from dataclasses import dataclass


LAG_PATTERN = re.compile(r"^(?P<base>.+)_lag_(?P<lag>\d+)$")


@dataclass(frozen=True)
class FeatureRef:
    name: str
    base_name: str
    lag: int | None = None

    @property
    def is_lagged(self) -> bool:
        return self.lag is not None


def parse_feature_name(name: str) -> FeatureRef:
    match = LAG_PATTERN.match(name)
    if not match:
        return FeatureRef(name=name, base_name=name)

    return FeatureRef(
        name=name,
        base_name=match.group("base"),
        lag=int(match.group("lag")),
    )


def translate_feature(name: str, feature_map: dict[str, str]) -> str:
    ref = parse_feature_name(name)
    label = feature_map.get(ref.base_name)
    if label is None:
        raise KeyError(f"Missing feature label for {ref.base_name}")
    if ref.is_lagged:
        return f"{label} (lag {ref.lag})"
    return label


def validate_feature_reference(
    name: str,
    *,
    raw_columns: set[str],
    feature_map: dict[str, str],
    require_label: bool = True,
) -> None:
    ref = parse_feature_name(name)
    if ref.base_name not in raw_columns:
        raise ValueError(f"Feature {name} references missing column {ref.base_name}")
    if ref.is_lagged and (ref.lag is None or ref.lag <= 0):
        raise ValueError(f"Feature {name} has an invalid lag")
    if require_label and ref.base_name not in feature_map:
        raise ValueError(f"Feature {name} references {ref.base_name}, which is missing from feature_map.json")

