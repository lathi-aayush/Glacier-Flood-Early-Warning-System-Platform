import httpx

def test_cdse():
    url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
    # Query for Sentinel-2 L2A product intersecting South Lhonak lake coordinates (88.5822, 27.9158)
    params = {
        "$filter": "Collection/Name eq 'SENTINEL-2' and OData.CSC.Intersects(area=geography'SRID=4326;POINT(88.5822 27.9158)') and contains(Name,'_MSIL2A_')",
        "$orderby": "ContentDate/Start desc",
        "$top": "1"
    }
    print("Querying Copernicus CDSE OData API...")
    try:
        resp = httpx.get(url, params=params, timeout=20.0)
        print("Status code:", resp.status_code)
        if resp.status_code == 200:
            data = resp.json()
            val = data.get("value", [])
            if val:
                prod = val[0]
                print("Product Name:", prod.get("Name"))
                print("Acquisition Timestamp:", prod.get("ContentDate", {}).get("Start"))
                print("Product ID:", prod.get("Id"))
                return prod
            else:
                print("No products found.")
        else:
            print("Response:", resp.text[:400])
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    test_cdse()
