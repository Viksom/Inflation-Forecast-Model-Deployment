from app.loaders.config_loader import load_configs, validate_configs
from app.loaders.data_loader import load_raw_data
from app.loaders.model_loader import load_models, load_preprocessor
from app.services.context import ApplicationContext


def load_application_context() -> ApplicationContext:
    raw_data = load_raw_data()
    feature_map, scenario_presets, model_metrics, variable_sets = load_configs()

    validate_configs(
        raw_data=raw_data,
        feature_map=feature_map,
        scenario_presets=scenario_presets,
        model_metrics=model_metrics,
        variable_sets=variable_sets,
    )

    models = load_models(raw_columns=set(raw_data.columns), feature_map=feature_map)
    preprocessor = load_preprocessor()

    return ApplicationContext(
        raw_data=raw_data,
        feature_map=feature_map,
        scenario_presets=scenario_presets,
        model_metrics=model_metrics,
        variable_sets=variable_sets,
        models=models,
        preprocessor=preprocessor,
    )

