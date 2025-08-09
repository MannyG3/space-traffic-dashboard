const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const cron = require('node-cron');
const satelliteAPI = require('./services/satelliteAPI');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://space-traffic-dashboard.vercel.app", "https://*.vercel.app"]
      : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database setup - use in-memory database for Vercel deployment
const db = new sqlite3.Database(process.env.NODE_ENV === 'production' ? ':memory:' : './space_traffic.db');

// Initialize database tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS satellites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    norad_id TEXT UNIQUE,
    name TEXT,
    latitude REAL,
    longitude REAL,
    altitude REAL,
    velocity REAL,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);



  db.run(`CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    satellite_id TEXT,
    alert_type TEXT,
    message TEXT,
    severity TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS api_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_name TEXT,
    status TEXT,
    satellites_count INTEGER,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Global variables
let currentSatellites = [];
let currentAlerts = [];

// Function to update satellite positions
async function updateSatellitePositions() {
  try {
    console.log('Fetching satellite data from APIs...');
    
    // Get satellite data from APIs
    const satellites = await satelliteAPI.getAllSatelliteData();
    
    if (satellites && satellites.length > 0) {
      // Update positions with simulated movement
      const updatedSatellites = satelliteAPI.updateSatellitePositions(satellites);
      currentSatellites = updatedSatellites;

      // Update database
      updatedSatellites.forEach(satellite => {
        db.run(`INSERT OR REPLACE INTO satellites (norad_id, name, latitude, longitude, altitude, velocity, last_updated)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [satellite.norad_id, satellite.name, satellite.latitude, satellite.longitude, satellite.altitude, satellite.velocity]
        );
      });

      console.log(`Updated ${updatedSatellites.length} satellites`);
      
      // Log API success
      db.run(`INSERT INTO api_logs (api_name, status, satellites_count) VALUES (?, ?, ?)`,
        ['combined', 'success', updatedSatellites.length]
      );
    } else {
      console.log('No satellite data received from APIs');
      
      // Log API failure
      db.run(`INSERT INTO api_logs (api_name, status, satellites_count, error_message) VALUES (?, ?, ?, ?)`,
        ['combined', 'error', 0, 'No data received']
      );
    }
  } catch (error) {
    console.error('Error updating satellite positions:', error);
    
    // Log API error
    db.run(`INSERT INTO api_logs (api_name, status, satellites_count, error_message) VALUES (?, ?, ?, ?)`,
      ['combined', 'error', 0, error.message]
    );
  }
}

// Function to check for potential collisions
function checkCollisions() {
  const alerts = [];

  for (let i = 0; i < currentSatellites.length; i++) {
    for (let j = i + 1; j < currentSatellites.length; j++) {
      const sat1 = currentSatellites[i];
      const sat2 = currentSatellites[j];

      // Calculate 3D distance
      const latDiff = sat1.latitude - sat2.latitude;
      const lonDiff = sat1.longitude - sat2.longitude;
      const altDiff = sat1.altitude - sat2.altitude;
      
      const distance = Math.sqrt(
        Math.pow(latDiff, 2) + 
        Math.pow(lonDiff, 2) + 
        Math.pow(altDiff / 100, 2) // Normalize altitude difference
      );

      // Check for collision risk based on distance
      if (distance < 50) { // 50km threshold
        const severity = distance < 20 ? 'HIGH' : distance < 35 ? 'MEDIUM' : 'LOW';
        
        alerts.push({
          satellite_id: `${sat1.norad_id}-${sat2.norad_id}`,
          alert_type: "COLLISION_RISK",
          message: `Potential collision risk between ${sat1.name} and ${sat2.name} (Distance: ${distance.toFixed(1)}km)`,
          severity: severity
        });
      }
    }

    // Check for low altitude warnings
    const sat = currentSatellites[i];
    if (sat.altitude < 300) {
      alerts.push({
        satellite_id: sat.norad_id,
        alert_type: "LOW_ALTITUDE",
        message: `${sat.name} is operating at critical altitude (${sat.altitude.toFixed(0)}km)`,
        severity: sat.altitude < 200 ? 'HIGH' : 'MEDIUM'
      });
    }

    // Check for high velocity warnings
    if (sat.velocity > 8) {
      alerts.push({
        satellite_id: sat.norad_id,
        alert_type: "HIGH_VELOCITY",
        message: `${sat.name} is traveling at high velocity (${sat.velocity.toFixed(2)} km/s)`,
        severity: sat.velocity > 9 ? 'HIGH' : 'MEDIUM'
      });
    }
  }

  return alerts;
}

// API Routes
app.get('/api/satellites', (req, res) => {
  db.all("SELECT * FROM satellites ORDER BY last_updated DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/alerts', (req, res) => {
  db.all("SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/stats', (req, res) => {
  db.get("SELECT COUNT(*) as total_satellites FROM satellites", (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    db.get("SELECT COUNT(*) as active_alerts FROM alerts WHERE severity = 'HIGH'", (err, alertRow) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({
        total_satellites: row.total_satellites,
        active_alerts: alertRow.active_alerts,
        last_update: new Date().toISOString()
      });
    });
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    satellites_count: currentSatellites.length,
    alerts_count: currentAlerts.length,
    database: 'connected'
  });
});

app.get('/api/logs', (req, res) => {
  db.all("SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 20", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial data
  socket.emit('satellites', currentSatellites);
  socket.emit('alerts', currentAlerts);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Schedule updates
const updateInterval = process.env.SATELLITE_UPDATE_INTERVAL || 30;
const collisionInterval = process.env.COLLISION_CHECK_INTERVAL || 60;

// Update satellite positions every 30 seconds (or configured interval)
cron.schedule(`*/${updateInterval} * * * * *`, async () => {
  await updateSatellitePositions();
  
  // Emit updated satellites to all connected clients
  io.emit('satellites', currentSatellites);
});

// Check for collisions every 60 seconds (or configured interval)
cron.schedule(`*/${collisionInterval} * * * * *`, () => {
  const newAlerts = checkCollisions();
  
  if (newAlerts.length > 0) {
    // Store new alerts in database
    newAlerts.forEach(alert => {
      db.run(`INSERT INTO alerts (satellite_id, alert_type, message, severity)
              VALUES (?, ?, ?, ?)`,
        [alert.satellite_id, alert.alert_type, alert.message, alert.severity]
      );
    });

    // Update current alerts
    currentAlerts = [...newAlerts, ...currentAlerts].slice(0, 50); // Keep last 50 alerts
    
    // Emit alerts to all connected clients
    io.emit('alerts', newAlerts);
  }
});

// Initialize data on startup
updateSatellitePositions().then(() => {
  console.log('Initial satellite data loaded');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Space Traffic Server running on port ${PORT}`);
  console.log(`📊 Dashboard available at: http://localhost:3000`);
  console.log(`🔧 API Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Using ${process.env.USE_MOCK_DATA === 'true' ? 'mock' : 'real'} satellite data`);
});
