# main.py — FastAPI backend for Satellite Traffic Dashboard

import asyncio
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Dict, Set, Tuple, List

import aiohttp
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from n2yo_client import above, positions, tle
from conj import find_close_pairs

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# ---------- API key (from environment variable) ----------
N2YO_API_KEY = os.getenv("N2YO_API_KEY", "").strip()
if not N2YO_API_KEY:
    print("WARNING: N2YO_API_KEY not set. Set it in .env file or environment variable.")

# ---------- Config ----------
API_POLL_INTERVAL = 5
ABOVE_POLL_INTERVAL = 90  # Increased to reduce API calls and rate limit issues
POSITIONS_SECONDS = 60
LEO_MAX_ALT = 2000.0
GEO_CATEGORY = 10
PROXIMITY_THRESHOLD_KM = 5.0
MAX_PARALLEL_REQUESTS = 4  # Limit parallel requests to avoid rate limits

# /above radius in KM (for N2YO)
ABOVE_SEARCH_RADIUS_KM = 5000  # Balanced: good coverage without being too slow
ABOVE_SEEDS: List[Tuple[float, float]] = [
    # Reduced to 6 strategic points to avoid rate limits
    (0.0, 0.0), (0.0, 120.0), (0.0, 240.0),  # Equator: 3 points
    (45.0, 60.0), (45.0, 180.0), (45.0, 300.0),  # Northern: 3 points
]

# DEMO mode: simulate satellites without any API
# Default to demo on Vercel unless explicitly overridden.
demo_default = "1" if os.getenv("VERCEL") == "1" else "0"
DEMO_MODE = os.getenv("DEMO_MODE", demo_default) == "1"
FRONTEND_DIR = BASE_DIR.parent / "frontend"


# ----------------------------
# Lifespan (startup / shutdown)
# ----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    if not FRONTEND_DIR.exists():
        print(f"WARNING: frontend directory not found at: {FRONTEND_DIR}")

    # Start broadcast immediately so frontend gets responses right away
    asyncio.create_task(broadcast_snapshot())

    if DEMO_MODE:
        print("Starting DEMO MODE (simulated satellites, no external APIs).")
        asyncio.create_task(demo_loop())
    elif N2YO_API_KEY:
        # Delay tracker loop start to allow server to respond immediately
        async def delayed_start():
            await asyncio.sleep(2)  # Give server 2 seconds to start responding
            print("Starting satellite tracker loops...")
            asyncio.create_task(tracker_loop(N2YO_API_KEY))
            asyncio.create_task(positions_loop(N2YO_API_KEY))

        asyncio.create_task(delayed_start())
    else:
        print("WARNING: N2YO_API_KEY missing. Set env var or enable DEMO_MODE=1.")

    yield
    # shutdown: nothing to clean up in serverless


app = FastAPI(title="Sat Traffic Backend", lifespan=lifespan)
# In serverless deployments (e.g., Vercel), the `frontend/` directory may not be
# packaged with the Python function. Avoid crashing on import.
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
else:
    print(f"INFO: frontend directory not found at {FRONTEND_DIR}; /static disabled")

tracked: Dict[int, dict] = {}
clients: Set[WebSocket] = set()
_last_n2yo_error: str | None = None

# ----------------------------
# Routes
# ----------------------------
@app.get("/")
async def index():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    # If deployed behind a static frontend (e.g., Vercel), `/` should be served
    # by the static build. Return a helpful response instead of 500.
    return JSONResponse(
        {
            "error": "frontend_not_packaged",
            "message": "Frontend files were not found in this runtime. Serve / from static hosting and call /api/snapshot for data.",
        },
        status_code=404,
    )

@app.get("/health")
async def health():
    return {
        "ok": True,
        "tracked": len(tracked),
        "clients": len(clients),
        "has_api_key": bool(N2YO_API_KEY),
        "demo_mode": DEMO_MODE,
        "n2yo_error": _last_n2yo_error,
    }

@app.get("/api/snapshot")
async def api_snapshot():
    """REST API endpoint for polling (used when WebSocket not available, e.g., Vercel)"""
    # Serverless note (Vercel): background tasks aren't reliable. For DEMO_MODE,
    # generate/advance demo data on-demand so the UI always has something to show.
    if DEMO_MODE or not N2YO_API_KEY:
        _ensure_demo_catalog()
        _demo_step(time.time())
    sats = list(tracked.values())
    pairs = find_close_pairs(sats, PROXIMITY_THRESHOLD_KM)
    alert_pairs = [
        {"a": p[0].get("satname"), "b": p[1].get("satname"), "dist_km": float(p[2])}
        for p in pairs
    ]
    return {
        "ts": datetime.utcnow().isoformat() + "Z",
        "sats": sats,
        "counts": {
            "total": len(sats),
            "leo": sum(1 for s in sats if s.get("category") == "LEO"),
            "geo": sum(1 for s in sats if s.get("category") == "GEO"),
            "alerts": len(alert_pairs),
        },
        "alerts": alert_pairs,
    }

@app.get("/debug/n2yo")
async def debug_n2yo(lat: float = 0.0, lng: float = 0.0, radius_km: int = ABOVE_SEARCH_RADIUS_KM):
    if DEMO_MODE:
        return {"error": "DEMO_MODE enabled — N2YO disabled"}
    if not N2YO_API_KEY:
        return {"error": "N2YO_API_KEY not set"}
    try:
        async with aiohttp.ClientSession() as s:
            geo = await above(s, N2YO_API_KEY, lat, lng, 0, radius_km, category=GEO_CATEGORY)
            allr = await above(s, N2YO_API_KEY, lat, lng, 0, radius_km, category=0)
        def shape(resp):
            if isinstance(resp, dict):
                return {
                    "error": resp.get("error"),
                    "info": resp.get("info"),
                    "above_count": len(resp.get("above", [])) if "above" in resp else None,
                    "sample": resp.get("above", [])[:3] if "above" in resp else None,
                }
            return {"raw_type": str(type(resp))}
        return JSONResponse({"lat": lat, "lng": lng, "radius_km": radius_km, "geo": shape(geo), "all": shape(allr)})
    except Exception as e:
        return {"error": str(e)}

@app.get("/debug/tle")
async def debug_tle(satid: int = 25544):
    if DEMO_MODE:
        return {"error": "DEMO_MODE enabled — N2YO disabled"}
    if not N2YO_API_KEY:
        return {"error": "N2YO_API_KEY not set"}
    try:
        async with aiohttp.ClientSession() as s:
            t = await tle(s, N2YO_API_KEY, satid)
        return JSONResponse(t)
    except Exception as e:
        return {"error": str(e)}

@app.get("/debug/positions")
async def debug_positions(satid: int = 25544, seconds: int = 60):
    if DEMO_MODE:
        return {"error": "DEMO_MODE enabled — N2YO disabled"}
    if not N2YO_API_KEY:
        return {"error": "N2YO_API_KEY not set"}
    try:
        async with aiohttp.ClientSession() as s:
            p = await positions(s, N2YO_API_KEY, satid, 0.0, 0.0, 0, seconds)
        return JSONResponse({
            "error": p.get("error"),
            "info": p.get("info"),
            "positions_count": len(p.get("positions", [])) if isinstance(p, dict) else None,
            "sample": p.get("positions", [])[:2] if isinstance(p, dict) else None
        })
    except Exception as e:
        return {"error": str(e)}

@app.post("/load-all-satellites")
async def load_all_satellites():
    """Trigger a comprehensive satellite load by querying all seed points (parallelized for speed)"""
    if DEMO_MODE:
        return {"error": "DEMO_MODE enabled — N2YO disabled"}
    if not N2YO_API_KEY:
        return {"error": "N2YO_API_KEY not set"}
    
    try:
        async with aiohttp.ClientSession() as session:
            now = time.time()
            initial_count = len(tracked)
            
            # Parallelize all API calls
            async def fetch_geo(lat, lng):
                try:
                    return await above(session, N2YO_API_KEY, lat, lng, 0, ABOVE_SEARCH_RADIUS_KM, category=GEO_CATEGORY)
                except Exception:
                    return {}
            
            async def fetch_all(lat, lng):
                try:
                    return await above(session, N2YO_API_KEY, lat, lng, 0, ABOVE_SEARCH_RADIUS_KM, category=0)
                except Exception:
                    return {}
            
            geo_tasks = [fetch_geo(lat, lng) for lat, lng in ABOVE_SEEDS]
            all_tasks = [fetch_all(lat, lng) for lat, lng in ABOVE_SEEDS]
            
            geo_responses, all_responses = await asyncio.gather(
                asyncio.gather(*geo_tasks, return_exceptions=True),
                asyncio.gather(*all_tasks, return_exceptions=True)
            )
            
            # Process responses
            for geo_resp in geo_responses:
                if isinstance(geo_resp, Exception) or not isinstance(geo_resp, dict):
                    continue
                if not geo_resp.get("error"):
                    for item in geo_resp.get("above", []):
                        satid = int(item["satid"])
                        tracked.setdefault(satid, {})
                        tracked[satid].update({
                            "satid": satid,
                            "satname": item.get("satname"),
                            "satlat": float(item.get("satlat")) if item.get("satlat") is not None else None,
                            "satlng": float(item.get("satlng")) if item.get("satlng") is not None else None,
                            "satalt": float(item.get("satalt", 0.0)),
                            "category": "GEO",
                            "last_update": now,
                        })
            
            for all_resp in all_responses:
                if isinstance(all_resp, Exception) or not isinstance(all_resp, dict):
                    continue
                if not all_resp.get("error"):
                    for item in all_resp.get("above", []):
                        alt = float(item.get("satalt", 0.0))
                        if alt < LEO_MAX_ALT:
                            satid = int(item["satid"])
                            tracked.setdefault(satid, {})
                            tracked[satid].update({
                                "satid": satid,
                                "satname": item.get("satname"),
                                "satlat": float(item.get("satlat")) if item.get("satlat") is not None else None,
                                "satlng": float(item.get("satlng")) if item.get("satlng") is not None else None,
                                "satalt": alt,
                                "category": "LEO",
                                "last_update": now,
                            })
            
            return JSONResponse({
                "success": True,
                "total_tracked": len(tracked),
                "newly_loaded": len(tracked) - initial_count,
                "leo_count": sum(1 for s in tracked.values() if s.get("category") == "LEO"),
                "geo_count": sum(1 for s in tracked.values() if s.get("category") == "GEO"),
            })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.websocket("/ws/stream")
async def stream(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    print("WS client connected")
    try:
        while True:
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("WS client disconnected")
        clients.discard(ws)

# ----------------------------
# N2YO-backed background tasks
# ----------------------------
async def broadcast_snapshot():
    # Send initial empty snapshot immediately so frontend doesn't wait
    await asyncio.sleep(0.1)  # Small delay to let WebSocket connections establish
    while True:
        try:
            sats = list(tracked.values())
            pairs = find_close_pairs(sats, PROXIMITY_THRESHOLD_KM)
            alert_pairs = [
                {"a": p[0].get("satname"), "b": p[1].get("satname"), "dist_km": float(p[2])}
                for p in pairs
            ]
            payload = {
                "ts": datetime.utcnow().isoformat() + "Z",
                "sats": sats,
                "counts": {
                    "total": len(sats),
                    "leo": sum(1 for s in sats if s.get("category") == "LEO"),
                    "geo": sum(1 for s in sats if s.get("category") == "GEO"),
                    "alerts": len(alert_pairs),
                },
                "alerts": alert_pairs,
            }
            dead = []
            for ws in set(clients):
                try:
                    await ws.send_json({"type": "snapshot", "data": payload})
                except Exception:
                    dead.append(ws)
            for d in dead:
                clients.discard(d)
        except Exception as e:
            print("broadcast error:", e)
        await asyncio.sleep(1.0)

async def tracker_loop(api_key: str):
    async with aiohttp.ClientSession() as session:
        while True:
            try:
                global _last_n2yo_error
                _last_n2yo_error = None
                now = time.time()
                
                # Parallelize all API calls for much faster loading
                async def fetch_geo(lat, lng):
                    try:
                        return await above(session, api_key, lat, lng, 0, ABOVE_SEARCH_RADIUS_KM, category=GEO_CATEGORY)
                    except Exception as e:
                        print(f"GEO fetch error for ({lat}, {lng}): {e}")
                        return {}
                
                async def fetch_all(lat, lng):
                    try:
                        return await above(session, api_key, lat, lng, 0, ABOVE_SEARCH_RADIUS_KM, category=0)
                    except Exception as e:
                        print(f"ALL fetch error for ({lat}, {lng}): {e}")
                        return {}
                
                # Fetch in batches to avoid rate limits
                geo_responses = []
                all_responses = []
                
                # Process in batches of MAX_PARALLEL_REQUESTS
                for i in range(0, len(ABOVE_SEEDS), MAX_PARALLEL_REQUESTS):
                    batch = ABOVE_SEEDS[i:i + MAX_PARALLEL_REQUESTS]
                    geo_batch = [fetch_geo(lat, lng) for lat, lng in batch]
                    all_batch = [fetch_all(lat, lng) for lat, lng in batch]
                    
                    batch_geo = await asyncio.gather(*geo_batch, return_exceptions=True)
                    batch_all = await asyncio.gather(*all_batch, return_exceptions=True)
                    
                    geo_responses.extend(batch_geo)
                    all_responses.extend(batch_all)
                    
                    # Small delay between batches to respect rate limits
                    if i + MAX_PARALLEL_REQUESTS < len(ABOVE_SEEDS):
                        await asyncio.sleep(0.5)  # Reduced from 1.0 to 0.5 for faster loading
                
                # Process GEO responses
                for geo_resp in geo_responses:
                    if isinstance(geo_resp, Exception):
                        continue
                    if isinstance(geo_resp, dict) and geo_resp.get("error"):
                        error_msg = geo_resp.get("error", "")
                        _last_n2yo_error = error_msg
                        if "exceeded" in error_msg.lower() or "rate limit" in error_msg.lower():
                            print(f"Rate limit hit! Skipping remaining requests.")
                            break
                    for item in geo_resp.get("above", []) if isinstance(geo_resp, dict) else []:
                        satid = int(item["satid"])
                        tracked.setdefault(satid, {})
                        tracked[satid].update({
                            "satid": satid,
                            "satname": item.get("satname"),
                            "satlat": float(item.get("satlat")) if item.get("satlat") is not None else None,
                            "satlng": float(item.get("satlng")) if item.get("satlng") is not None else None,
                            "satalt": float(item.get("satalt", 0.0)),
                            "category": "GEO",
                            "last_update": now,
                        })
                
                # Process ALL responses (filter to LEO)
                for all_resp in all_responses:
                    if isinstance(all_resp, Exception):
                        continue
                    if isinstance(all_resp, dict) and all_resp.get("error"):
                        error_msg = all_resp.get("error", "")
                        _last_n2yo_error = error_msg
                        if "exceeded" in error_msg.lower() or "rate limit" in error_msg.lower():
                            print(f"Rate limit hit! Skipping remaining requests.")
                            break
                    for item in all_resp.get("above", []) if isinstance(all_resp, dict) else []:
                        alt = float(item.get("satalt", 0.0))
                        if alt < LEO_MAX_ALT:
                            satid = int(item["satid"])
                            tracked.setdefault(satid, {})
                            tracked[satid].update({
                                "satid": satid,
                                "satname": item.get("satname"),
                                "satlat": float(item.get("satlat")) if item.get("satlat") is not None else None,
                                "satlng": float(item.get("satlng")) if item.get("satlng") is not None else None,
                                "satalt": alt,
                                "category": "LEO",
                                "last_update": now,
                            })

                print(f"tracker_loop: tracked={len(tracked)}; n2yo_error={_last_n2yo_error}")
            except Exception as e:
                print("Error refreshing above lists:", e)
            await asyncio.sleep(ABOVE_POLL_INTERVAL)

async def positions_loop(api_key: str):
    async with aiohttp.ClientSession() as session:
        while True:
            try:
                sats = list(tracked.keys())
                max_fetch = 10000  # Increased from 200 to load all tracked satellites
                now = time.time()
                
                # Process in batches with parallel requests for speed
                batch_size = 50  # Process 50 satellites in parallel
                sats_to_update = sats[:max_fetch]
                
                async def update_position(satid):
                    try:
                        resp = await positions(session, api_key, satid, 0.0, 0.0, 0, POSITIONS_SECONDS)
                        if isinstance(resp, dict) and resp.get("error"):
                            global _last_n2yo_error
                            _last_n2yo_error = resp.get("error")
                            return None
                        pos_arr = resp.get("positions", [])
                        if pos_arr:
                            latest = pos_arr[0]
                            return (satid, {
                                "satlat": float(latest.get("satlatitude")) if latest.get("satlatitude") is not None else None,
                                "satlng": float(latest.get("satlongitude")) if latest.get("satlongitude") is not None else None,
                                "satalt": float(latest.get("sataltitude", 0.0)),
                                "last_update": now,
                            })
                    except Exception as e:
                        print(f"positions error for {satid}:", e)
                    return None
                
                # Process in batches
                for i in range(0, len(sats_to_update), batch_size):
                    batch = sats_to_update[i:i + batch_size]
                    results = await asyncio.gather(*[update_position(satid) for satid in batch], return_exceptions=True)
                    for result in results:
                        if result and isinstance(result, tuple):
                            satid, updates = result
                            if satid in tracked:
                                tracked[satid].update(updates)
                    # Small delay between batches to avoid rate limiting
                    if i + batch_size < len(sats_to_update):
                        await asyncio.sleep(0.1)
            except Exception as e:
                print("positions loop error:", e)
            await asyncio.sleep(API_POLL_INTERVAL)

# ----------------------------
# DEMO simulator (no external APIs)
# ----------------------------
def _ensure_demo_catalog():
    if tracked:
        return
    now = time.time()
    # 12 GEO evenly spaced
    for i in range(12):
        satid = 900000 + i
        tracked[satid] = {
            "satid": satid,
            "satname": f"GEO-{i+1:02d}",
            "satlat": 0.0,
            "satlng": i * 30.0,    # degrees
            "satalt": 35786.0,     # km
            "category": "GEO",
            "last_update": now,
        }
    # 30 LEO with different inclinations
    for i in range(30):
        satid = 910000 + i
        tracked[satid] = {
            "satid": satid,
            "satname": f"LEO-{i+1:02d}",
            "satlat": (i % 6) * 10 - 25,   # -25..25 deg
            "satlng": (i * 12) % 360,
            "satalt": 550.0,
            "category": "LEO",
            "last_update": now,
        }

async def demo_loop():
    _ensure_demo_catalog()
    while True:
        _demo_step(time.time())
        await asyncio.sleep(1.0)

def _demo_step(now: float):
    """Advance demo satellites one step based on wall-clock time."""
    omega_geo = 360.0 / (24 * 3600)         # deg per second
    omega_leo = 360.0 / (95 * 60)           # ~95 min orbit
    for s in tracked.values():
        last = float(s.get("last_update") or now)
        dt = max(0.0, now - last)
        if s.get("category") == "GEO":
            s["satlng"] = (float(s.get("satlng") or 0.0) + omega_geo * dt) % 360.0
            s["satlat"] = 0.0
        else:
            s["satlng"] = (float(s.get("satlng") or 0.0) + omega_leo * dt) % 360.0
            # small latitude oscillation based on absolute time
            t = now % (95 * 60)
            s["satlat"] = 30.0 * __import__("math").sin(2 * __import__("math").pi * t / (95 * 60))
        s["last_update"] = now

# ----------------------------
# Entrypoint
# ----------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
