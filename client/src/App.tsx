import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Satellite, Alert, Stats } from './types';
import { satelliteAPI, alertAPI, statsAPI } from './services/api';
import Header from './components/Header';
import StatsPanel from './components/StatsPanel';
import SatelliteMap from './components/SatelliteMap';
import SatelliteList from './components/SatelliteList';
import AlertPanel from './components/AlertPanel';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_satellites: 0,
    active_alerts: 0,
    last_update: new Date().toISOString()
  });
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // For production deployment without backend, use mock data
    if (process.env.NODE_ENV === 'production') {
      console.log('Production mode: Using mock data');
      setConnectionStatus('connected');
      
      // Generate mock satellite data
      const mockSatellites: Satellite[] = [
        {
          norad_id: "25544",
          name: "ISS (ZARYA)",
          latitude: 51.5074,
          longitude: -0.1278,
          altitude: 408,
          velocity: 7.66,
          last_updated: new Date().toISOString(),
          source: 'mock'
        },
        {
          norad_id: "37849",
          name: "STARLINK-1234",
          latitude: 40.7128,
          longitude: -74.0060,
          altitude: 550,
          velocity: 7.8,
          last_updated: new Date().toISOString(),
          source: 'mock'
        },
        {
          norad_id: "37850",
          name: "STARLINK-1235",
          latitude: 34.0522,
          longitude: -118.2437,
          altitude: 550,
          velocity: 7.8,
          last_updated: new Date().toISOString(),
          source: 'mock'
        },
        {
          norad_id: "37851",
          name: "STARLINK-1236",
          latitude: 41.8781,
          longitude: -87.6298,
          altitude: 550,
          velocity: 7.8,
          last_updated: new Date().toISOString(),
          source: 'mock'
        },
        {
          norad_id: "37852",
          name: "STARLINK-1237",
          latitude: 29.7604,
          longitude: -95.3698,
          altitude: 550,
          velocity: 7.8,
          last_updated: new Date().toISOString(),
          source: 'mock'
        },
        {
          norad_id: "37853",
          name: "HST (Hubble)",
          latitude: 25.7617,
          longitude: -80.1918,
          altitude: 547,
          velocity: 7.6,
          last_updated: new Date().toISOString(),
          source: 'mock'
        },
        {
          norad_id: "37854",
          name: "GPS IIR-11",
          latitude: 39.8283,
          longitude: -98.5795,
          altitude: 20200,
          velocity: 3.9,
          last_updated: new Date().toISOString(),
          source: 'mock'
        },
        {
          norad_id: "37855",
          name: "GPS IIR-12",
          latitude: 35.6762,
          longitude: 139.6503,
          altitude: 20200,
          velocity: 3.9,
          last_updated: new Date().toISOString(),
          source: 'mock'
        }
      ];

      setSatellites(mockSatellites);
      setStats({
        total_satellites: mockSatellites.length,
        active_alerts: 0,
        last_update: new Date().toISOString()
      });

      // Simulate real-time updates
      const interval = setInterval(() => {
        setSatellites(prev => prev.map(sat => ({
          ...sat,
          latitude: sat.latitude + (Math.random() - 0.5) * 2,
          longitude: sat.longitude + (Math.random() - 0.5) * 2,
          altitude: Math.max(200, Math.min(2000, sat.altitude + (Math.random() - 0.5) * 10)),
          last_updated: new Date().toISOString()
        })));
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    } else {
      // Development mode: Connect to backend
      const socketUrl = 'http://localhost:5000';
      const newSocket = io(socketUrl);
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnectionStatus('connected');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnectionStatus('disconnected');
      });

      newSocket.on('satellites', (data: Satellite[]) => {
        setSatellites(data);
        setStats(prev => ({
          ...prev,
          total_satellites: data.length,
          last_update: new Date().toISOString()
        }));
      });

      newSocket.on('alerts', (data: Alert[]) => {
        setAlerts(prev => [...data, ...prev].slice(0, 50)); // Keep last 50 alerts
        setStats(prev => ({
          ...prev,
          active_alerts: data.filter(alert => alert.severity === 'HIGH').length
        }));
      });

      return () => {
        newSocket.close();
      };
    }
  }, []);

  // Load initial data (only in development mode)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const loadInitialData = async () => {
        try {
          const [satellitesData, alertsData, statsData] = await Promise.all([
            satelliteAPI.getAll(),
            alertAPI.getAll(),
            statsAPI.getStats()
          ]);

          setSatellites(satellitesData);
          setAlerts(alertsData);
          setStats(statsData);
        } catch (error) {
          console.error('Error loading initial data:', error);
        }
      };

      loadInitialData();
    }
  }, []);

  const handleSatelliteSelect = (satellite: Satellite) => {
    setSelectedSatellite(satellite);
  };

  const formatLastUpdate = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString();
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen animated-bg">
        <Header
          connectionStatus={connectionStatus}
          lastUpdate={formatLastUpdate(stats.last_update)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Panel */}
          <div className="mb-6">
            <StatsPanel stats={stats} satellites={satellites} />
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 dashboard-grid">
            {/* Left Column - Map */}
            <div className="lg:col-span-2">
              <SatelliteMap
                satellites={satellites}
                selectedSatellite={selectedSatellite}
                onSatelliteSelect={handleSatelliteSelect}
              />
            </div>

            {/* Right Column - Lists */}
            <div className="space-y-6">
              <SatelliteList
                satellites={satellites}
                selectedSatellite={selectedSatellite}
                onSatelliteSelect={handleSatelliteSelect}
              />

              <AlertPanel alerts={alerts} />
            </div>
          </div>

          {/* Connection Status Footer */}
          <div className="mt-8 text-center">
            <div className="glass-dark rounded-xl p-4 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-accent-green' : 'bg-accent-red'
                  } status-indicator`}></div>
                  <span className="text-gray-400">
                    {connectionStatus === 'connected' ? 'Live data streaming active' : 'Connection issues detected'}
                  </span>
                </div>

                <div className="text-gray-500">•</div>

                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">Tracking {satellites.length} satellites</span>
                </div>

                <div className="text-gray-500">•</div>

                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">{alerts.length} total alerts</span>
                </div>

                <div className="text-gray-500">•</div>

                <div className="flex items-center space-x-2">
                  <span className="text-gray-400">
                    Last updated: {formatLastUpdate(stats.last_update)}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Space Traffic Controller Dashboard • Real-time Satellite Monitoring System
              </div>
            </div>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
