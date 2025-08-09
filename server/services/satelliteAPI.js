const axios = require('axios');
require('dotenv').config();

class SatelliteAPIService {
  constructor() {
    this.spaceTrackToken = null;
    this.spaceTrackTokenExpiry = null;
    // Default to mock data if no environment variable is set or if explicitly set to true
    this.useMockData = !process.env.USE_MOCK_DATA || process.env.USE_MOCK_DATA === 'true';
  }

  // Space-Track.org API Integration
  async authenticateSpaceTrack() {
    try {
      const response = await axios.post('https://www.space-track.org/ajaxauth/login', {
        identity: process.env.SPACE_TRACK_USERNAME,
        password: process.env.SPACE_TRACK_PASSWORD
      });

      if (response.data && response.headers['set-cookie']) {
        this.spaceTrackToken = response.headers['set-cookie'][0];
        this.spaceTrackTokenExpiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        console.log('Space-Track.org authentication successful');
        return true;
      }
    } catch (error) {
      console.error('Space-Track.org authentication failed:', error.message);
      return false;
    }
  }

  async getSpaceTrackData() {
    if (!process.env.SPACE_TRACK_USERNAME || !process.env.SPACE_TRACK_PASSWORD) {
      console.log('Space-Track.org credentials not configured');
      return null;
    }

    try {
      // Check if token is expired
      if (!this.spaceTrackToken || (this.spaceTrackTokenExpiry && new Date() > this.spaceTrackTokenExpiry)) {
        await this.authenticateSpaceTrack();
      }

      if (!this.spaceTrackToken) {
        return null;
      }

      // Get TLE data for active satellites
      const response = await axios.get('https://www.space-track.org/basicspacedata/query/class/tle_latest/ORDINAL/1/EPOCH/%3Enow-30/orderby/NORAD_CAT_ID/format/json', {
        headers: {
          'Cookie': this.spaceTrackToken
        }
      });

      return this.parseSpaceTrackData(response.data);
    } catch (error) {
      console.error('Error fetching Space-Track.org data:', error.message);
      return null;
    }
  }

  parseSpaceTrackData(data) {
    if (!Array.isArray(data)) return [];

    return data.map(item => ({
      norad_id: item.NORAD_CAT_ID,
      name: item.OBJECT_NAME || `Satellite-${item.NORAD_CAT_ID}`,
      tle_line1: item.TLE_LINE1,
      tle_line2: item.TLE_LINE2,
      epoch: item.EPOCH,
      source: 'space-track'
    }));
  }

  // N2YO API Integration
  async getN2YOData() {
    if (!process.env.N2YO_API_KEY) {
      console.log('N2YO API key not configured');
      return null;
    }

    try {
      // Get visible satellites (example: ISS)
      const response = await axios.get(`https://api.n2yo.com/rest/v1/satellite/positions/25544/0/0/0/1/&apiKey=${process.env.N2YO_API_KEY}`);
      
      if (response.data && response.data.positions) {
        return this.parseN2YOData(response.data);
      }
    } catch (error) {
      console.error('Error fetching N2YO data:', error.message);
      return null;
    }
  }

  parseN2YOData(data) {
    const positions = data.positions || [];
    return positions.map(pos => ({
      norad_id: data.info.satid.toString(),
      name: data.info.satname,
      latitude: parseFloat(pos.satlatitude),
      longitude: parseFloat(pos.satlongitude),
      altitude: parseFloat(pos.sataltitude),
      velocity: 7.8, // Approximate orbital velocity
      timestamp: pos.timestamp,
      source: 'n2yo'
    }));
  }

  // Satellite Tracker API Integration
  async getSatelliteTrackerData() {
    if (!process.env.SATELLITE_TRACKER_API_KEY) {
      console.log('Satellite Tracker API key not configured');
      return null;
    }

    try {
      // Example endpoint - adjust based on actual API documentation
      const response = await axios.get(`https://api.satellitetracker.com/v1/satellites/active?apiKey=${process.env.SATELLITE_TRACKER_API_KEY}`);
      
      if (response.data && response.data.satellites) {
        return this.parseSatelliteTrackerData(response.data.satellites);
      }
    } catch (error) {
      console.error('Error fetching Satellite Tracker data:', error.message);
      return null;
    }
  }

  parseSatelliteTrackerData(satellites) {
    return satellites.map(sat => ({
      norad_id: sat.norad_id,
      name: sat.name,
      latitude: sat.latitude,
      longitude: sat.longitude,
      altitude: sat.altitude,
      velocity: sat.velocity || 7.8,
      source: 'satellite-tracker'
    }));
  }

  // Combined data fetching
  async getAllSatelliteData() {
    if (this.useMockData) {
      console.log('Using mock data as configured');
      return this.getMockData();
    }

    const results = await Promise.allSettled([
      this.getSpaceTrackData(),
      this.getN2YOData(),
      this.getSatelliteTrackerData()
    ]);

    let allSatellites = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allSatellites = allSatellites.concat(result.value);
        console.log(`API ${index + 1} returned ${result.value.length} satellites`);
      } else {
        console.log(`API ${index + 1} failed or returned no data`);
      }
    });

    // Remove duplicates based on NORAD ID
    const uniqueSatellites = this.removeDuplicates(allSatellites);
    
    // If no data from APIs, fall back to mock data
    if (uniqueSatellites.length === 0) {
      console.log('No satellite data received from APIs, using mock data as fallback');
      return this.getMockData();
    }
    
    // Convert to standard format
    return this.convertToStandardFormat(uniqueSatellites);
  }

  removeDuplicates(satellites) {
    const seen = new Set();
    return satellites.filter(sat => {
      const duplicate = seen.has(sat.norad_id);
      seen.add(sat.norad_id);
      return !duplicate;
    });
  }

  convertToStandardFormat(satellites) {
    return satellites.map(sat => ({
      norad_id: sat.norad_id,
      name: sat.name,
      latitude: sat.latitude || 0,
      longitude: sat.longitude || 0,
      altitude: sat.altitude || 400,
      velocity: sat.velocity || 7.8,
      last_updated: new Date().toISOString(),
      source: sat.source || 'unknown'
    }));
  }

  // Mock data generation (fallback)
  getMockData() {
    const mockSatellites = [
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

    return mockSatellites;
  }

  // Update satellite positions (simulate orbital movement)
  updateSatellitePositions(satellites) {
    return satellites.map(satellite => {
      // Simulate orbital movement
      const latChange = (Math.random() - 0.5) * 2;
      const lonChange = (Math.random() - 0.5) * 2;
      const altChange = (Math.random() - 0.5) * 10;

      return {
        ...satellite,
        latitude: Math.max(-90, Math.min(90, satellite.latitude + latChange)),
        longitude: Math.max(-180, Math.min(180, satellite.longitude + lonChange)),
        altitude: Math.max(200, Math.min(2000, satellite.altitude + altChange)),
        last_updated: new Date().toISOString()
      };
    });
  }
}

module.exports = new SatelliteAPIService();
