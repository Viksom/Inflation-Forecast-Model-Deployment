MODEL_REGISTRY = {
    "ARIMA": {
        "path": "models/classical/ARIMA_014_Model.pkl",
        "type": "classical"
    },

    "VAR": {
        "path": "models/classical/VAR_Model_Teoricas.pkl",
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