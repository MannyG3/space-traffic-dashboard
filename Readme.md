# Satellite Traffic Dashboard

A real-time satellite monitoring and collision detection system built with FastAPI, WebSocket, and Cesium.js for 3D globe visualization.

## Features

### Real-time Satellite Tracking
- Live satellite positions from N2YO API
- Interactive 3D globe visualization using Cesium.js
- Support for LEO (Low Earth Orbit) and GEO (Geostationary) satellites
- WebSocket-based real-time updates

### Collision Detection
- Proximity alerts for satellites within 5km of each other
- Real-time alert feed with audio notifications
- Mute/unmute functionality for alerts

### Dashboard Interface
- Total satellite count with LEO/GEO breakdown
- Interactive satellite selection on the globe
- Detailed satellite information panel (name, ID, altitude, coordinates)
- Home button to reset camera view

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **WebSocket** - Real-time bidirectional communication
- **aiohttp** - Async HTTP client for API calls
- **uvicorn** - ASGI server

### Frontend
- **Cesium.js** - 3D globe visualization
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with glass morphism effects

### Data Source
- **N2YO API** - Satellite tracking data (https://www.n2yo.com/api/)

## Installation

### Prerequisites
- Python 3.10+
- N2YO API key (free at https://www.n2yo.com/api/)

### Setup

1. Clone the repository
```bash
git clone https://github.com/MannyG3/space-traffic-dashboard.git
cd space-traffic-dashboard
```

2. Create virtual environment
```bash
cd backend
python -m venv venv
```

3. Activate virtual environment
```bash
# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. Install dependencies
```bash
pip install -r requirements.txt
```

5. Configure environment variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your N2YO API key
N2YO_API_KEY=your_api_key_here
```

6. Run the server
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

7. Open browser
```
http://localhost:8000
```

## Project Structure

```
space-traffic-dashboard/
├── backend/
│   ├── main.py           # FastAPI application
│   ├── n2yo_client.py    # N2YO API client
│   ├── conj.py           # Collision detection logic
│   ├── requirements.txt  # Python dependencies
│   ├── .env.example      # Environment variables template
│   └── .env              # Your API key (not in repo)
├── frontend/
│   ├── index.html        # Main HTML page
│   ├── app.js            # Frontend JavaScript
│   └── styles.css        # Styling
├── .gitignore
└── Readme.md
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serves the dashboard |
| `/health` | GET | Health check with satellite count |
| `/ws/stream` | WebSocket | Real-time satellite data stream |
| `/load-all-satellites` | POST | Trigger full satellite load |
| `/debug/n2yo` | GET | Debug N2YO API response |
| `/debug/tle` | GET | Get TLE data for a satellite |
| `/debug/positions` | GET | Get position data for a satellite |

## Configuration

Configuration options in `main.py`:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_POLL_INTERVAL` | 5 | Seconds between position updates |
| `ABOVE_POLL_INTERVAL` | 90 | Seconds between satellite discovery |
| `LEO_MAX_ALT` | 2000 | Maximum altitude (km) for LEO classification |
| `PROXIMITY_THRESHOLD_KM` | 5.0 | Distance threshold for collision alerts |
| `MAX_PARALLEL_REQUESTS` | 4 | Concurrent API requests limit |

## Demo Mode

To run without an API key (simulated satellites):
```bash
# Set environment variable
DEMO_MODE=1

# Or in .env file
DEMO_MODE=1
```

### Vercel behavior

- `vercel.json` sets `DEMO_MODE=1` for deployments.
- Backend also defaults to demo mode automatically when running on Vercel (`VERCEL=1`) if `DEMO_MODE` is not explicitly set.

## Deploy to Vercel

From the project root:

```bash
# Preview deployment
npx -y vercel deploy --yes

# Production deployment
npx -y vercel deploy --prod --yes
```

If the project is not linked yet, link it first:

```bash
npx -y vercel link
```

## License

MIT License

## Author

Mayur Gund - mayurgund@yahoo.com

## Acknowledgments

- N2YO for satellite tracking API
- Cesium for 3D globe visualization
- FastAPI for the backend framework
