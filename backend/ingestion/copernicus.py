import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import httpx

from backend.core.config import settings, reload_settings

logger = logging.getLogger("glacierguard.cdse")

_MSIL2A_ACQ_RE = re.compile(r"_MSIL2A_(\d{8}T\d{6})")
_CLOUD_ATTR_NAMES = {"cloudCover", "CloudCover", "cloudcover"}


def parse_acquisition_datetime(
    value: Optional[str], product_name: Optional[str] = None
) -> Optional[datetime]:
    """Parse CDSE ContentDate/Start or the sensing time embedded in an S2 product name."""
    if value:
        raw = value.strip()
        if raw.endswith("Z"):
            raw = raw[:-1] + "+00:00"
        try:
            dt = datetime.fromisoformat(raw)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.astimezone(timezone.utc)
        except ValueError:
            pass

    if product_name:
        match = _MSIL2A_ACQ_RE.search(product_name)
        if match:
            return datetime.strptime(match.group(1), "%Y%m%dT%H%M%S").replace(tzinfo=timezone.utc)
    return None


def format_acquisition_iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _attr_value(product: Dict[str, Any], names: set[str]) -> Optional[Any]:
    for attr in product.get("Attributes") or []:
        if attr.get("Name") in names:
            return attr.get("Value")
    return None


class CopernicusClient:
    """
    Copernicus Data Space Ecosystem (CDSE) client for Sentinel-2.

    Auth (optional for catalog search, required for authenticated rate limits / downloads):
      - OAuth2 client_credentials: COPERNICUS_CLIENT_ID + COPERNICUS_CLIENT_SECRET
      - Password grant: COPERNICUS_USERNAME + COPERNICUS_PASSWORD (client_id=cdse-public)

    Catalog search itself is public; credentials are used when present so the
    background worker can fetch the exact latest L2A acquisition timestamp
    with an authenticated session.
    """

    def __init__(self) -> None:
        self.catalog_url = settings.COPERNICUS_CATALOGUE_URL
        self.token_url = settings.COPERNICUS_TOKEN_URL
        self.client_id = (settings.COPERNICUS_CLIENT_ID or "").strip()
        self.client_secret = (settings.COPERNICUS_CLIENT_SECRET or "").strip()
        self.username = (getattr(settings, "COPERNICUS_USERNAME", "") or "").strip()
        self.password = (getattr(settings, "COPERNICUS_PASSWORD", "") or "").strip()
        self._access_token: Optional[str] = None
        self._token_expires_at: float = 0.0

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret) or bool(self.username and self.password)

    def auth_mode(self) -> str:
        if self.client_id and self.client_secret:
            return "client_credentials"
        if self.username and self.password:
            return "password"
        return "public_catalog"

    def reload_from_settings(self) -> None:
        """Pick up credentials if .env is edited without restarting (best-effort)."""
        cfg = reload_settings()
        self.client_id = (cfg.COPERNICUS_CLIENT_ID or "").strip()
        self.client_secret = (cfg.COPERNICUS_CLIENT_SECRET or "").strip()
        self.username = (getattr(cfg, "COPERNICUS_USERNAME", "") or "").strip()
        self.password = (getattr(cfg, "COPERNICUS_PASSWORD", "") or "").strip()
        self.catalog_url = cfg.COPERNICUS_CATALOGUE_URL
        self.token_url = cfg.COPERNICUS_TOKEN_URL
        self._access_token = None
        self._token_expires_at = 0.0

    async def get_auth_token(self) -> Optional[str]:
        if not self.is_configured():
            return None

        now = datetime.now(timezone.utc).timestamp()
        if self._access_token and now < (self._token_expires_at - 60):
            return self._access_token

        if self.client_id and self.client_secret:
            payload = {
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            }
        else:
            payload = {
                "grant_type": "password",
                "username": self.username,
                "password": self.password,
                "client_id": self.client_id or "cdse-public",
            }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(self.token_url, data=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    self._access_token = data.get("access_token")
                    expires_in = float(data.get("expires_in", 300))
                    self._token_expires_at = now + expires_in
                    logger.info("CDSE OAuth token acquired (%s, expires in %.0fs)", self.auth_mode(), expires_in)
                    return self._access_token
                logger.error("CDSE auth failed: HTTP %s %s", resp.status_code, resp.text[:300])
                return None
        except Exception as exc:
            logger.error("CDSE auth exception: %s", exc)
            return None

    def _build_filter(self, lat: float, lng: float, lookback_days: Optional[int]) -> str:
        clauses = [
            "Collection/Name eq 'SENTINEL-2'",
            f"OData.CSC.Intersects(area=geography'SRID=4326;POINT({lng} {lat})')",
            "contains(Name,'_MSIL2A_')",
        ]
        if lookback_days is not None:
            start = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime(
                "%Y-%m-%dT00:00:00.000Z"
            )
            clauses.append(f"ContentDate/Start ge {start}")
        return " and ".join(clauses)

    async def fetch_latest_sentinel2_pass(
        self,
        lat: float,
        lng: float,
        *,
        client: Optional[httpx.AsyncClient] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Return the most recent Sentinel-2 Level-2A scene covering (lat, lng),
        including the exact sensing/acquisition timestamp.
        """
        token = await self.get_auth_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}

        owns_client = client is None
        http = client or httpx.AsyncClient(timeout=30.0)
        try:
            product = None
            for lookback in (60, 180, None):
                product = await self._query_latest(http, lat, lng, lookback, headers)
                if product:
                    break
            if not product:
                return None

            name = product.get("Name") or ""
            content_date = product.get("ContentDate") or {}
            start_raw = content_date.get("Start")
            acq_dt = parse_acquisition_datetime(start_raw, name)
            if acq_dt is None:
                logger.warning("CDSE product %s had no parseable acquisition date", name)
                return None

            cloud_raw = _attr_value(product, _CLOUD_ATTR_NAMES)
            try:
                cloud_cover = float(cloud_raw) if cloud_raw is not None else None
            except (TypeError, ValueError):
                cloud_cover = None

            return {
                "source": "Copernicus Sentinel-2",
                "collection": "SENTINEL-2",
                "product_type": "S2MSI2A",
                "product_id": product.get("Id"),
                "product_name": name,
                "acquisition_timestamp": format_acquisition_iso(acq_dt),
                "origin_date": product.get("OriginDate"),
                "publication_date": product.get("PublicationDate"),
                "cloud_cover_pct": cloud_cover,
                "online": product.get("Online"),
                "footprint": product.get("Footprint") or product.get("GeoFootprint"),
                "is_authenticated": bool(token),
                "auth_mode": self.auth_mode(),
            }
        except Exception as exc:
            logger.warning("Could not fetch Sentinel-2 pass for (%s, %s): %s", lat, lng, exc)
            return None
        finally:
            if owns_client:
                await http.aclose()

    async def _query_latest(
        self,
        http: httpx.AsyncClient,
        lat: float,
        lng: float,
        lookback_days: Optional[int],
        headers: Dict[str, str],
    ) -> Optional[Dict[str, Any]]:
        params = {
            "$filter": self._build_filter(lat, lng, lookback_days),
            "$orderby": "ContentDate/Start desc",
            "$top": "1",
            "$select": "Id,Name,ContentDate,OriginDate,PublicationDate,Footprint,GeoFootprint,Online",
            "$expand": "Attributes",
        }
        resp = await http.get(self.catalog_url, params=params, headers=headers)
        if resp.status_code == 400 and "$expand" in params:
            params.pop("$expand")
            resp = await http.get(self.catalog_url, params=params, headers=headers)

        if resp.status_code != 200:
            logger.warning(
                "CDSE catalog HTTP %s (lookback=%s): %s",
                resp.status_code,
                lookback_days,
                resp.text[:240],
            )
            return None

        values = (resp.json() or {}).get("value") or []
        return values[0] if values else None


copernicus_client = CopernicusClient()
