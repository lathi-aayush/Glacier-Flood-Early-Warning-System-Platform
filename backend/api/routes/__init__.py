from backend.api.routes.health import router as health_router
from backend.api.routes.lakes import router as lakes_router
from backend.api.routes.alerts import router as alerts_router
from backend.api.routes.features import router as features_router
from backend.api.routes.simulation import router as simulation_router
from backend.api.routes.geo import router as geo_router

__all__ = ["health_router", "lakes_router", "alerts_router", "features_router", "simulation_router", "geo_router"]
