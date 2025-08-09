import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Satellite, AlertTriangle, MapPin } from 'lucide-react';
import { Satellite as SatelliteType } from '../types';

interface SatelliteMapProps {
  satellites: SatelliteType[];
  selectedSatellite: SatelliteType | null;
  onSatelliteSelect: (satellite: SatelliteType) => void;
}

// Custom satellite icon
const createSatelliteIcon = (isDanger: boolean) => {
  return L.divIcon({
    className: 'custom-satellite-icon',
    html: `
      <div class="relative">
        <div class="w-6 h-6 ${isDanger ? 'bg-accent-red' : 'bg-accent-blue'} rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 12a2 2 0 114 0 2 2 0 01-4 0z"/>
          </svg>
        </div>
        ${isDanger ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-accent-red rounded-full animate-pulse"></div>' : ''}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const SatelliteMap: React.FC<SatelliteMapProps> = ({
  satellites,
  selectedSatellite,
  onSatelliteSelect,
}) => {
  const getStatusColor = (altitude: number) => {
    if (altitude < 300) return 'text-accent-red';
    if (altitude < 500) return 'text-accent-yellow';
    return 'text-accent-green';
  };

  const getStatusText = (altitude: number) => {
    if (altitude < 300) return 'Critical Altitude';
    if (altitude < 500) return 'Warning Zone';
    return 'Normal Operation';
  };

  const getVelocityStatus = (velocity: number) => {
    if (velocity > 8) return 'text-accent-red';
    if (velocity > 7.5) return 'text-accent-yellow';
    return 'text-accent-green';
  };

  return (
    <div className="glass rounded-xl p-6 shadow-space">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-green rounded-lg flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <span>Satellite Tracking Map</span>
        </h2>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent-green rounded-full"></div>
            <span className="text-gray-400">Normal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent-yellow rounded-full"></div>
            <span className="text-gray-400">Warning</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-accent-red rounded-full animate-pulse"></div>
            <span className="text-gray-400">Critical</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          className="h-96 w-full rounded-lg overflow-hidden"
          style={{ minHeight: '400px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {satellites.map((satellite) => {
            const isDanger = satellite.altitude < 300;
            const icon = createSatelliteIcon(isDanger);
            
            return (
              <Marker
                key={satellite.norad_id}
                position={[satellite.latitude, satellite.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => onSatelliteSelect(satellite),
                }}
              >
                <Popup className="satellite-popup">
                  <div className="space-y-3 min-w-64">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-white">{satellite.name}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isDanger ? 'bg-accent-red/20 text-accent-red' : 'bg-accent-green/20 text-accent-green'
                      }`}>
                        {getStatusText(satellite.altitude)}
                      </div>
                    </div>

                    {/* NORAD ID */}
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-400 text-sm">NORAD ID:</span>
                      <span className="font-mono text-white">{satellite.norad_id}</span>
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-xs">Latitude</p>
                        <p className="font-mono text-white">{satellite.latitude.toFixed(4)}°</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Longitude</p>
                        <p className="font-mono text-white">{satellite.longitude.toFixed(4)}°</p>
                      </div>
                    </div>

                    {/* Altitude and Velocity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-400 text-xs">Altitude</p>
                        <p className={`font-bold ${getStatusColor(satellite.altitude)}`}>
                          {satellite.altitude.toFixed(0)} km
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Velocity</p>
                        <p className={`font-bold ${getVelocityStatus(satellite.velocity)}`}>
                          {satellite.velocity.toFixed(2)} km/s
                        </p>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => onSatelliteSelect(satellite)}
                      className="w-full mt-3 bg-gradient-to-r from-accent-blue to-accent-green text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      Track Satellite
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Map Controls Overlay */}
        <div className="absolute top-4 right-4 space-y-2">
          <div className="glass-dark rounded-lg p-2 text-center">
            <p className="text-xs text-gray-400">Active Satellites</p>
            <p className="text-lg font-bold text-white">{satellites.length}</p>
          </div>
          
          {selectedSatellite && (
            <div className="glass-dark rounded-lg p-3 max-w-xs">
              <div className="flex items-center space-x-2 mb-2">
                <Satellite className="w-4 h-4 text-accent-blue" />
                <span className="text-sm font-medium text-white">Selected</span>
              </div>
              <p className="text-xs text-white font-medium truncate">{selectedSatellite.name}</p>
              <p className="text-xs text-gray-400">{selectedSatellite.norad_id}</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 glass-dark rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-2">Altitude Status</p>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-green rounded-full"></div>
              <span className="text-xs text-white">&gt;500km (Safe)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-yellow rounded-full"></div>
              <span className="text-xs text-white">300-500km (Warning)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-red rounded-full animate-pulse"></div>
              <span className="text-xs text-white">&lt;300km (Critical)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteMap;
