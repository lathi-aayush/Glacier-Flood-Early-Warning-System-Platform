import httpx

LAKES = ["gl-00124", "gl-00452", "gl-00331", "gl-ct-12", "gl-00089", "gl-00215"]

def verify_geo_endpoints():
    print("=======================================================")
    print("--- [Phase D Verification] GeoJSON Flood Paths & Polygons ---")
    print("=======================================================")
    
    with httpx.Client(timeout=10.0) as client:
        for lake_id in LAKES:
            url = f"http://127.0.0.1:8000/lakes/{lake_id}/flood-path"
            res = client.get(url)
            assert res.status_code == 200, f"Expected 200 for {lake_id}, got {res.status_code}: {res.text}"
            data = res.json()
            
            assert data["type"] == "FeatureCollection"
            features = data["features"]
            assert len(features) >= 3, f"Expected at least 3 features for {lake_id}, got {len(features)}"
            
            # Verify feature types
            poly = next((f for f in features if f["geometry"]["type"] == "Polygon"), None)
            line = next((f for f in features if f["geometry"]["type"] == "LineString"), None)
            points = [f for f in features if f["geometry"]["type"] == "Point"]
            
            assert poly is not None, f"Missing Polygon for {lake_id}"
            assert line is not None, f"Missing LineString flood path for {lake_id}"
            assert len(points) >= 1, f"Missing settlement points for {lake_id}"
            
            print(f"[OK] Lake {lake_id} ({data['properties']['lake_name']}):")
            print(f"     - Polygon points: {len(poly['geometry']['coordinates'][0])}")
            print(f"     - Flood path corridor points: {len(line['geometry']['coordinates'])} (Total dist: {line['properties']['total_distance_km']} km, drop: {line['properties']['total_drop_m']} m)")
            print(f"     - Downstream settlements: {len(points)} nodes ({', '.join(p['properties']['name'] for p in points)})")
            
            # Verify elevation profile endpoint
            profile_url = f"http://127.0.0.1:8000/lakes/{lake_id}/elevation-profile"
            prof_res = client.get(profile_url)
            assert prof_res.status_code == 200
            prof_data = prof_res.json()
            assert len(prof_data["profile"]) >= 4, f"Expected elevation profile points for {lake_id}"
            print(f"     - Elevation profile points: {len(prof_data['profile'])} waypoints from {prof_data['outlet_elev_m']}m down")

    print("\n=======================================================")
    print(">>> ALL PHASE D GEO ENDPOINTS VERIFIED SUCCESSFULLY! <<<")
    print("=======================================================")

if __name__ == "__main__":
    verify_geo_endpoints()
