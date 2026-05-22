from fastapi import Request

from app.loaders.config_loader import load_configs, validate_configs
from app.loaders.data_loader import load_current_inflation
from app.services.context import ApplicationContext


def get_context(request: Request) -> ApplicationContext:
    context: ApplicationContext = request.app.state.context
    current_inflation = load_current_inflation()
    feature_map, scenario_presets, model_metrics, variable_sets = load_configs()
    validate_configs(
        raw_data=context.raw_data,
        feature_map=feature_map,
        scenario_presets=scenario_presets,
        model_metrics=model_metrics,
        variable_sets=variable_sets,
    )
    context.feature_map = feature_map
    context.scenario_presets = scenario_presets
    context.model_metrics = model_metrics
    context.variable_sets = variable_sets
    context.current_inflation = current_inflation
    return context

