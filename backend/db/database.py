import socket
import logging
from urllib.parse import urlparse
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.core.config import settings

logger = logging.getLogger("glacierguard.db")

def resolve_host_ip(hostname: str) -> str | None:
    """
    Resolves hostname to IPv4 address.
    If local DNS lookup fails (e.g. campus/corporate network returning RCODE_REFUSED for cloud DBs),
    falls back to DNS-over-HTTPS via Google DoH.
    """
    try:
        return socket.gethostbyname(hostname)
    except socket.gaierror:
        logger.info(f"Local DNS failed for '{hostname}', attempting DNS-over-HTTPS fallback...")
        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.get(f"https://dns.google/resolve?name={hostname}&type=A")
                if res.status_code == 200:
                    data = res.json()
                    for answer in data.get("Answer", []):
                        if answer.get("type") == 1:  # Type A IPv4
                            ip = answer.get("data")
                            logger.info(f"Resolved '{hostname}' via DoH to {ip}")
                            return ip
        except Exception as doh_err:
            logger.warning(f"DoH fallback error: {doh_err}")
    return None

db_url = settings.resolved_database_url

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Check if host needs IP resolution for libpq hostaddr
    try:
        parsed = urlparse(db_url)
        if parsed.hostname:
            resolved_ip = resolve_host_ip(parsed.hostname)
            if resolved_ip:
                connect_args["hostaddr"] = resolved_ip
    except Exception as e:
        logger.warning(f"Hostaddr pre-resolution skipped: {e}")

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True if not db_url.startswith("sqlite") else False,
    pool_recycle=300 if not db_url.startswith("sqlite") else -1
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
