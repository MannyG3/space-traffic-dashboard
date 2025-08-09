import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Satellite, Alert, Stats } from './types';
import { satelliteAPI, alertAPI, statsAPI } from './services/api';
import Header from './components/Header';
import StatsPanel from './components/StatsPanel';
import SatelliteMap from './components/SatelliteMap';
import SatelliteList from './components/SatelliteList';
import AlertPanel from './components/AlertPanel';

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
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin 
      : 'http://localhost:5000';
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
  }, []);

  // Load initial data
  useEffect(() => {
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
  }, []);

  const handleSatelliteSelect = (satellite: Satellite) => {
    setSelectedSatellite(satellite);
  };

  const formatLastUpdate = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString();
  };

  return (
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
  );
}

export default App;
