import React from 'react';
import { Satellite, AlertTriangle, TrendingUp, Gauge } from 'lucide-react';
import { Stats, Satellite as SatelliteType } from '../types';

interface StatsPanelProps {
  stats: Stats;
  satellites: SatelliteType[];
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, satellites }) => {
  const calculateAverageAltitude = () => {
    if (satellites.length === 0) return 0;
    const total = satellites.reduce((sum, sat) => sum + sat.altitude, 0);
    return Math.round(total / satellites.length);
  };

  const calculateAverageVelocity = () => {
    if (satellites.length === 0) return 0;
    const total = satellites.reduce((sum, sat) => sum + sat.velocity, 0);
    return Math.round(total / satellites.length * 100) / 100;
  };

  const getHighAlerts = () => {
    return satellites.filter(sat => sat.altitude < 300).length;
  };

  const statCards = [
    {
      title: 'Active Satellites',
      value: stats.total_satellites,
      icon: Satellite,
      color: 'from-accent-blue to-cyan-400',
      bgColor: 'bg-accent-blue/10',
      borderColor: 'border-accent-blue/20',
      description: 'Currently tracked'
    },
    {
      title: 'High Priority Alerts',
      value: stats.active_alerts,
      icon: AlertTriangle,
      color: 'from-accent-red to-red-400',
      bgColor: 'bg-accent-red/10',
      borderColor: 'border-accent-red/20',
      description: 'Require attention'
    },
    {
      title: 'Average Altitude',
      value: `${calculateAverageAltitude()} km`,
      icon: TrendingUp,
      color: 'from-accent-green to-green-400',
      bgColor: 'bg-accent-green/10',
      borderColor: 'border-accent-green/20',
      description: 'Mean orbital height'
    },
    {
      title: 'Average Velocity',
      value: `${calculateAverageVelocity()} km/s`,
      icon: Gauge,
      color: 'from-accent-yellow to-yellow-400',
      bgColor: 'bg-accent-yellow/10',
      borderColor: 'border-accent-yellow/20',
      description: 'Mean orbital speed'
    }
  ];

  return (
    <div className="glass rounded-xl p-6 shadow-space">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-blue to-accent-green rounded-lg flex items-center justify-center">
            <Gauge className="w-4 h-4 text-white" />
          </div>
          <span>System Statistics</span>
        </h2>
        <div className="text-sm text-gray-400 font-mono">
          Real-time metrics
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div
              key={index}
              className={`glass-dark border ${card.borderColor} rounded-xl p-4 card-hover group`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center ${card.bgColor}`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <div className={`w-2 h-2 bg-gradient-to-br ${card.color} rounded-full status-indicator`}></div>
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-bold text-white group-hover:text-gradient transition-colors">
                  {card.value}
                </p>
                <p className="text-sm font-medium text-gray-300">
                  {card.title}
                </p>
                <p className="text-xs text-gray-400">
                  {card.description}
                </p>
              </div>

              {/* Animated background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300`}></div>
            </div>
          );
        })}
      </div>

      {/* Additional Metrics Row */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-dark border border-white/10 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent-red/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-accent-red" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Low Altitude Satellites</p>
              <p className="text-lg font-bold text-white">{getHighAlerts()}</p>
            </div>
          </div>
        </div>

        <div className="glass-dark border border-white/10 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent-green/20 rounded-lg flex items-center justify-center">
              <Satellite className="w-4 h-4 text-accent-green" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Stable Orbits</p>
              <p className="text-lg font-bold text-white">{satellites.length - getHighAlerts()}</p>
            </div>
          </div>
        </div>

        <div className="glass-dark border border-white/10 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-accent-blue/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-accent-blue" />
            </div>
            <div>
              <p className="text-sm text-gray-400">System Health</p>
              <p className="text-lg font-bold text-accent-green">98%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
