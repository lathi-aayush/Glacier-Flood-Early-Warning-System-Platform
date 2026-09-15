import sys
import httpx

def test_simulation_endpoint():
    print("=======================================================")
    print("--- [Simulation Test 1/2] Baseline Simulation ---")
    print("=======================================================")
    url = "http://127.0.0.1:8000/ml/simulate"
    
    payload = {
        "lake_id": "gl-00124",
        "precip_24h_mm": 5.0,
        "temp_c": 1.0,
        "seismic_mag": 0.0,
        "area_delta_pct": 0.0
    }
    
    with httpx.Client(timeout=10.0) as client:
        res = client.post(url, json=payload)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        print("Lake:", data["lake_name"])
        print("Simulated Risk:", data["simulated_risk_score"], f"({data['simulated_tier']})")
        print("SOP Directive:", data["sop"]["protocol_level"])
        print("Waterfall Steps Count:", len(data["waterfall"]["steps"]))
        
        # Verify exact waterfall arithmetic
        base = data["waterfall"]["base_score"]
        steps_sum = sum(s["delta"] for s in data["waterfall"]["steps"])
        final = data["waterfall"]["final_score"]
        drift = abs((base + steps_sum) - final)
        print(f"Waterfall Math: Base ({base}) + Steps ({steps_sum:+.1f}) = {base + steps_sum:.1f} vs Final ({final}) [Drift: {drift:.2f}]")
        assert drift < 0.2, f"Waterfall drift too large: {drift}"
        print("[OK] Baseline simulation and waterfall math verified.")

    print("\n=======================================================")
    print("--- [Simulation Test 2/2] Extreme Trigger Scenario ---")
    print("=======================================================")
    extreme_payload = {
        "lake_id": "gl-00124",
        "precip_24h_mm": 95.0,
        "temp_c": 9.5,
        "seismic_mag": 6.2,
        "area_delta_pct": 25.0
    }
    with httpx.Client(timeout=10.0) as client:
        res = client.post(url, json=extreme_payload)
        assert res.status_code == 200
        ext_data = res.json()
        print("Simulated Risk under Extreme Monsoon + Seismic:", ext_data["simulated_risk_score"], f"({ext_data['simulated_tier']})")
        print("Risk Delta from Live Lake State:", ext_data["risk_delta"], "%")
        print("SOP Protocol:", ext_data["sop"]["protocol_level"])
        print("Urgency:", ext_data["sop"]["evacuation_urgency"])
        assert ext_data["simulated_risk_score"] >= 80.0, "Expected critical risk score"
        assert ext_data["simulated_tier"] == "critical"
        assert ext_data["is_anomaly"] is True, "Expected IsolationForest outlier"
        print("[OK] Extreme trigger simulation, critical escalation, and anomaly detection verified.")

    print("\n=======================================================")
    print(">>> ALL SIMULATOR & EXPLAINABILITY CHECKS PASSED! <<<")
    print("=======================================================")

if __name__ == "__main__":
    test_simulation_endpoint()
