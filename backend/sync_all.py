import httpx

def sync():
    print("Triggering full Copernicus Sentinel-2 live sync across all lakes...")
    resp = httpx.post("http://127.0.0.1:8000/lakes/sync-all", timeout=60.0)
    print("Status:", resp.status_code)
    data = resp.json()
    for l in data.get("synced_lakes", []):
        scene = (l.get("satellite_scene") or "N/A")[:40]
        print(f" -> {l['name']}: Last Updated = {l['last_updated']} | Scene = {scene}")

if __name__ == "__main__":
    sync()
