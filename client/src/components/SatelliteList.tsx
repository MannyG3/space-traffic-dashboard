import React from 'react';
import { Satellite, AlertTriangle, TrendingUp, MapPin, Clock } from 'lucide-react';
import { Satellite as SatelliteType } from '../types';

interface SatelliteListProps {
  satellites: SatelliteType[];
  selectedSatellite: SatelliteType | null;
  onSatelliteSelect: (satellite: SatelliteType) => void;
}

const SatelliteList: React.FC<SatelliteListProps> = ({
  satellites,
  selectedSatellite,
  onSatelliteSelect,
}) => {
  const getStatusColor = (altitude: number) => {
    if (altitude < 300) return 'text-accent-red';
    if (altitude < 500) return 'text-accent-yellow';
    return 'text-accent-green';
  };

  const getStatusIcon = (altitude: number) => {
    if (altitude < 300) return <AlertTriangle className="w-4 h-4" />;
    if (altitude < 500) return <TrendingUp className="w-4 h-4" />;
    return <Satellite className="w-4 h-4" />;
  };

  const getStatusText = (altitude: number) => {
    if (altitude < 300) return 'Critical';
    if (altitude < 500) return 'Warning';
    return 'Normal';
  };

  const getVelocityStatus = (velocity: number) => {
    if (velocity > 8) return 'text-accent-red';
    if (velocity > 7.5) return 'text-accent-yellow';
    return 'text-accent-green';
  };

  const formatLastUpdate = (timeString?: string) => {
    if (!timeString) return 'Unknown';
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  };

  return (
    <div className="glass rounded-xl p-6 shadow-space">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-green rounded-lg flex items-center justify-center">
            <Satellite className="w-4 h-4 text-white" />
          </div>
          <span>Active Satellites</span>
        </h2>
        <div className="text-sm text-gray-400 font-mono">
          {satellites.length} tracked
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        {satellites.map((satellite) => {
          const isSelected = selectedSatellite?.norad_id === satellite.norad_id;
          const isCritical = satellite.altitude < 300;
          
          return (
            <div
              key={satellite.norad_id}
              className={`glass-dark border rounded-xl p-4 cursor-pointer transition-all duration-300 card-hover group ${
                isSelected 
                  ? 'border-accent-blue shadow-glow' 
                  : 'border-white/10 hover:border-accent-blue/30'
              } ${isCritical ? 'pulse-alert' : ''}`}
              onClick={() => onSatelliteSelect(satellite)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isCritical 
                      ? 'bg-accent-red/20 text-accent-red' 
                      : 'bg-accent-blue/20 text-accent-blue'
                  }`}>
                    {getStatusIcon(satellite.altitude)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-gradient transition-colors">
                      {satellite.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">
                      NORAD: {satellite.norad_id}
                    </p>
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isCritical 
                    ? 'bg-accent-red/20 text-accent-red' 
                    : satellite.altitude < 500 
                    ? 'bg-accent-yellow/20 text-accent-yellow'
                    : 'bg-accent-green/20 text-accent-green'
                }`}>
                  {getStatusText(satellite.altitude)}
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Lat</p>
                    <p className="text-sm font-mono text-white">
                      {satellite.latitude.toFixed(4)}°
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Lon</p>
                    <p className="text-sm font-mono text-white">
                      {satellite.longitude.toFixed(4)}°
                    </p>
                  </div>
                </div>
              </div>

              {/* Altitude and Velocity */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Altitude</p>
                  <p className={`text-sm font-bold ${getStatusColor(satellite.altitude)}`}>
                    {satellite.altitude.toFixed(0)} km
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Velocity</p>
                  <p className={`text-sm font-bold ${getVelocityStatus(satellite.velocity)}`}>
                    {satellite.velocity.toFixed(2)} km/s
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatLastUpdate(satellite.last_updated)}</span>
                </div>
                
                {isSelected && (
                  <div className="flex items-center space-x-1 text-accent-blue">
                    <div className="w-2 h-2 bg-accent-blue rounded-full animate-pulse"></div>
                    <span>Selected</span>
                  </div>
                )}
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 to-accent-green/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300 pointer-events-none"></div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {satellites.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-accent-blue/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Satellite className="w-8 h-8 text-accent-blue" />
          </div>
          <p className="text-gray-400">No satellites currently tracked</p>
          <p className="text-sm text-gray-500">Satellite data will appear here when available</p>
        </div>
      )}
    </div>
  );
};

export default SatelliteList;
