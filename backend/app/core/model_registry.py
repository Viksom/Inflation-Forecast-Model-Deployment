MODEL_REGISTRY = {
    "ARIMA": {
        "path": "models/classical/ARIMA_014_Model.pkl",
        "type": "classical"
    },

    "CC-VAR": {
        "path": "models/classical/CCVAR_BestModel.pkl",
        "type": "classical"
    },

    "Ridge": {
        "path": "models/ml/ridge_model.pkl",
        "type": "ml",
        "scenario": True
    },
    
    "LightGBM": {
        "path": "models/ml/lgbm_model.pkl",
        "type": "ml",
        "scenario": True
    }
}
