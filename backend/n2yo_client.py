# n2yo_client.py
# Small client to call N2YO endpoints used by the dashboard.
import aiohttp
from typing import Any

BASE = "https://api.n2yo.com/rest/v1/satellite"

async def call_n2yo(session: aiohttp.ClientSession, path: str, api_key: str, params: dict = None) -> Any:
    if params is None:
        params = {}
    params['apiKey'] = api_key
    url = f"{BASE}/{path}"
    async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=30)) as resp:
        text = await resp.text()
        if resp.status != 200:
            raise RuntimeError(f"N2YO error {resp.status}: {text}")
        return await resp.json()

async def above(session: aiohttp.ClientSession, api_key: str, lat: float, lng: float, alt: int, radius: int, category: int = 0):
    # /above/{lat}/{lng}/{alt}/{search_radius}/{category_id}/
    path = f"above/{lat}/{lng}/{alt}/{radius}/{category}/"
    return await call_n2yo(session, path, api_key)

async def positions(session: aiohttp.ClientSession, api_key: str, satid: int, observer_lat: float, observer_lng: float, observer_alt: int, seconds: int):
    # /positions/{id}/{observer_lat}/{observer_lng}/{observer_alt}/{seconds}/
    path = f"positions/{satid}/{observer_lat}/{observer_lng}/{observer_alt}/{seconds}/"
    return await call_n2yo(session, path, api_key)
async def tle(session: aiohttp.ClientSession, api_key: str, satid: int):
    path = f"tle/{satid}/"
    return await call_n2yo(session, path, api_key)