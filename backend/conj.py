# conj.py
# Simple proximity-based conjunction screening for demo purposes.
import math

def haversine_km(lat1, lon1, lat2, lon2):
    """Approx great-circle distance for lat/lon (km) – spherical Earth."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1))
         * math.cos(math.radians(lat2))
         * (math.sin(dlon / 2) ** 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def euclidean_km_from_latlonalt(lat1, lon1, alt1_km, lat2, lon2, alt2_km):
    """Approx ECEF Euclidean distance (km) from lat/lon/alt."""
    R = 6371.0  # mean Earth radius in km

    def to_ecef(lat, lon, alt_km):
        phi = math.radians(lat)
        lam = math.radians(lon)
        r = R + alt_km
        x = r * math.cos(phi) * math.cos(lam)
        y = r * math.cos(phi) * math.sin(lam)
        z = r * math.sin(phi)
        return (x, y, z)

    x1, y1, z1 = to_ecef(lat1, lon1, alt1_km)
    x2, y2, z2 = to_ecef(lat2, lon2, alt2_km)
    return math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2)

def find_close_pairs(sat_list, threshold_km=5.0):
    """
    sat_list: list of dicts with keys: satid, satname, satlat, satlng, satalt (km), category
    returns list of pairs (a,b, distance_km)
    """
    pairs = []
    n = len(sat_list)
    for i in range(n):
        a = sat_list[i]
        if a.get('satlat') is None or a.get('satlng') is None:
            continue
        for j in range(i + 1, n):
            b = sat_list[j]
            if b.get('satlat') is None or b.get('satlng') is None:
                continue
            d = euclidean_km_from_latlonalt(
                a['satlat'], a['satlng'], float(a.get('satalt', 0.0)),
                b['satlat'], b['satlng'], float(b.get('satalt', 0.0))
            )
            if d <= threshold_km:
                pairs.append((a, b, d))
    return pairs
