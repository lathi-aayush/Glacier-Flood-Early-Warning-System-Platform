import json
import httpx

url = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
params = {
    "$filter": (
        "Collection/Name eq 'SENTINEL-2' and "
        "OData.CSC.Intersects(area=geography'SRID=4326;POINT(88.5822 27.9158)') and "
        "contains(Name,'_MSIL2A_')"
    ),
    "$orderby": "ContentDate/Start desc",
    "$top": "1",
    "$select": "Id,Name,ContentDate,OriginDate,PublicationDate,Online",
}
r = httpx.get(url, params=params, timeout=30.0)
print("status", r.status_code)
if r.status_code == 200:
    print(json.dumps(r.json(), indent=2)[:2000])
else:
    print(r.text[:1500])
