import React from 'react';
import { Wifi, WifiOff, Clock, Satellite, Activity } from 'lucide-react';

interface HeaderProps {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  lastUpdate: string;
}

const Header: React.FC<HeaderProps> = ({ connectionStatus, lastUpdate }) => {
  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live Data Active';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Connection Lost';
      default:
        return 'Unknown';
    }
  };

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-accent-green';
      case 'connecting':
        return 'text-accent-yellow';
      case 'disconnected':
        return 'text-accent-red';
      default:
        return 'text-gray-400';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-5 h-5" />;
      case 'connecting':
        return <Activity className="w-5 h-5 animate-spin" />;
      case 'disconnected':
        return <WifiOff className="w-5 h-5" />;
      default:
        return <Wifi className="w-5 h-5" />;
    }
  };

  return (
    <header className="glass-dark border-b border-white/10 shadow-space">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-blue to-accent-green rounded-xl flex items-center justify-center shadow-glow">
                <Satellite className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent-green rounded-full status-indicator"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">
                Space Traffic Controller
              </h1>
              <p className="text-sm text-gray-400 font-mono">
                Real-time Satellite Monitoring System
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`${getConnectionColor()} ${connectionStatus === 'connected' ? 'glow-green' : ''}`}>
                {getConnectionIcon()}
              </div>
              <div className="text-sm">
                <p className={`font-medium ${getConnectionColor()}`}>
                  {getConnectionText()}
                </p>
                <p className="text-gray-400 text-xs">
                  {connectionStatus === 'connected' ? 'All systems operational' : 'Check connection'}
                </p>
              </div>
            </div>

            {/* Last Update */}
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="font-mono">
                Last Update: {lastUpdate}
              </span>
            </div>

            {/* System Status */}
            <div className="hidden md:flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent-green rounded-full status-indicator"></div>
              <span className="text-sm text-gray-400">System Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="h-1 bg-gradient-to-r from-accent-blue via-accent-green to-accent-blue bg-size-200 animate-pulse"></div>
    </header>
  );
};

export default Header;
