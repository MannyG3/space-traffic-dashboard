import React, { useState } from 'react';
import { AlertTriangle, X, Bell, Clock, AlertCircle, Info } from 'lucide-react';
import { Alert } from '../types';

interface AlertPanelProps {
  alerts: Alert[];
}

const AlertPanel: React.FC<AlertPanelProps> = ({ alerts }) => {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'text-accent-red';
      case 'MEDIUM':
        return 'text-accent-yellow';
      case 'LOW':
        return 'text-accent-blue';
      default:
        return 'text-gray-400';
    }
  };

  const getSeverityBgColor = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-accent-red/20 border-accent-red/30';
      case 'MEDIUM':
        return 'bg-accent-yellow/20 border-accent-yellow/30';
      case 'LOW':
        return 'bg-accent-blue/20 border-accent-blue/30';
      default:
        return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <AlertTriangle className="w-4 h-4" />;
      case 'MEDIUM':
        return <AlertCircle className="w-4 h-4" />;
      case 'LOW':
        return <Info className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'Critical';
      case 'MEDIUM':
        return 'Warning';
      case 'LOW':
        return 'Info';
      default:
        return 'Unknown';
    }
  };

  const formatAlertTime = (timeString?: string) => {
    if (!timeString) return 'Unknown';
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    return alert.severity === filter.toUpperCase();
  });

  const getAlertCount = (severity: string) => {
    return alerts.filter(alert => alert.severity === severity).length;
  };

  const filterButtons = [
    { key: 'all', label: 'All', count: alerts.length },
    { key: 'high', label: 'Critical', count: getAlertCount('HIGH') },
    { key: 'medium', label: 'Warning', count: getAlertCount('MEDIUM') },
    { key: 'low', label: 'Info', count: getAlertCount('LOW') },
  ];

  return (
    <div className="glass rounded-xl p-6 shadow-space">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-red to-accent-yellow rounded-lg flex items-center justify-center">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <span>Alert System</span>
        </h2>
        <div className="text-sm text-gray-400 font-mono">
          {alerts.length} total
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {filterButtons.map((button) => (
          <button
            key={button.key}
            onClick={() => setFilter(button.key as any)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
              filter === button.key
                ? 'bg-accent-blue text-white shadow-glow'
                : 'bg-white/10 text-gray-400 hover:bg-white/20'
            }`}
          >
            {button.label}
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
              {button.count}
            </span>
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
        {filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, index) => (
            <div
              key={`${alert.satellite_id}-${index}`}
              className={`glass-dark border rounded-xl p-4 transition-all duration-300 card-hover group ${
                alert.severity === 'HIGH' ? 'pulse-alert' : ''
              } ${getSeverityBgColor(alert.severity)}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    alert.severity === 'HIGH' 
                      ? 'bg-accent-red/20 text-accent-red' 
                      : alert.severity === 'MEDIUM'
                      ? 'bg-accent-yellow/20 text-accent-yellow'
                      : 'bg-accent-blue/20 text-accent-blue'
                  }`}>
                    {getSeverityIcon(alert.severity)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getSeverityColor(alert.severity)}`}>
                        {getSeverityText(alert.severity)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {alert.alert_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono">
                      ID: {alert.satellite_id}
                    </p>
                  </div>
                </div>
                
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alert.severity === 'HIGH' 
                    ? 'bg-accent-red/30 text-accent-red' 
                    : alert.severity === 'MEDIUM'
                    ? 'bg-accent-yellow/30 text-accent-yellow'
                    : 'bg-accent-blue/30 text-accent-blue'
                }`}>
                  {alert.severity}
                </div>
              </div>

              {/* Message */}
              <div className="mb-3">
                <p className="text-sm text-white leading-relaxed">
                  {alert.message}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatAlertTime(alert.created_at)}</span>
                </div>
                
                {alert.severity === 'HIGH' && (
                  <div className="flex items-center space-x-1 text-accent-red">
                    <div className="w-2 h-2 bg-accent-red rounded-full animate-pulse"></div>
                    <span>Requires immediate attention</span>
                  </div>
                )}
              </div>

              {/* Hover effect overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-red/5 to-accent-yellow/5 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-accent-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-accent-green" />
            </div>
            <p className="text-gray-400">No alerts to display</p>
            <p className="text-sm text-gray-500">
              {filter === 'all' 
                ? 'All systems are operating normally' 
                : `No ${filter} priority alerts at this time`
              }
            </p>
          </div>
        )}
      </div>

      {/* Alert Summary */}
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-accent-red">{getAlertCount('HIGH')}</p>
              <p className="text-xs text-gray-400">Critical</p>
            </div>
            <div>
              <p className="text-lg font-bold text-accent-yellow">{getAlertCount('MEDIUM')}</p>
              <p className="text-xs text-gray-400">Warning</p>
            </div>
            <div>
              <p className="text-lg font-bold text-accent-blue">{getAlertCount('LOW')}</p>
              <p className="text-xs text-gray-400">Info</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertPanel;
