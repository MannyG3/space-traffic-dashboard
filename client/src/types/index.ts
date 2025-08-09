export interface Satellite {
  id?: number;
  norad_id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  last_updated?: string;
}

export interface Alert {
  id?: number;
  satellite_id: string;
  alert_type: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  created_at?: string;
}

export interface Stats {
  total_satellites: number;
  active_alerts: number;
  last_update: string;
}

export interface MapMarker {
  id: string;
  position: [number, number];
  satellite: Satellite;
}
