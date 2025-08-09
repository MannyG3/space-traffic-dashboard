# 🛰️ Space Traffic Controller Dashboard

A real-time satellite monitoring and collision detection system built with React, Node.js, and WebSocket technology.

![Space Traffic Dashboard](https://img.shields.io/badge/Status-Live-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.10.0-green)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue)

## 🌟 Features

### 🛰️ Real-time Satellite Tracking
- **Live Satellite Positions**: Track satellites in real-time with simulated orbital movement
- **Interactive World Map**: Visualize satellite locations using React Leaflet
- **Satellite Details**: View comprehensive information including NORAD ID, altitude, velocity, and coordinates
- **Status Indicators**: Color-coded altitude and velocity status (Safe, Warning, Critical)

### 🚨 Collision Detection System
- **Proximity Alerts**: Automatic detection of potential satellite collisions
- **Altitude Warnings**: Monitor satellites operating at critical altitudes
- **Velocity Monitoring**: Track satellites traveling at high velocities
- **Alert Categories**: HIGH, MEDIUM, LOW severity levels with real-time notifications

### 📊 Advanced Analytics
- **System Statistics**: Real-time metrics including active satellites, alerts, and system health
- **Performance Monitoring**: Track average altitude, velocity, and orbital stability
- **Historical Data**: Maintain logs of satellite movements and alert history

### 🎨 Modern UI/UX
- **Glass Morphism Design**: Beautiful glass-like interface with blur effects
- **Animated Backgrounds**: Dynamic space-themed visual elements
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Dark Theme**: Eye-friendly dark interface perfect for monitoring environments

### 🔌 API Integration Ready
- **Space-Track.org**: Integration ready for real satellite data (requires registration)
- **N2YO API**: Free tier satellite tracking API support
- **Satellite Tracker API**: Additional data source integration
- **Mock Data Fallback**: Reliable simulation data when APIs are unavailable

## 🚀 Live Demo

**🌐 Deployed on Vercel**: [Space Traffic Dashboard](https://space-traffic-dashboard-kdvsc7qr5-mayur-gunds-projects.vercel.app)

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Leaflet** for interactive maps
- **Socket.IO Client** for real-time communication
- **Axios** for HTTP requests
- **Lucide React** for icons
- **Recharts** for data visualization

### Backend
- **Node.js** with Express
- **Socket.IO** for WebSocket connections
- **SQLite** for data persistence
- **Node-cron** for scheduled tasks
- **Axios** for external API calls

### Deployment
- **Vercel** for hosting and deployment
- **GitHub** for version control

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/space-traffic-dashboard.git
   cd space-traffic-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start development servers**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

### Manual Installation

#### Backend Setup
```bash
cd server
npm install
npm run dev
```

#### Frontend Setup
```bash
cd client
npm install
npm start
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `server` directory:

```env
# API Configuration
SPACE_TRACK_USERNAME=your_username
SPACE_TRACK_PASSWORD=your_password
N2YO_API_KEY=your_api_key
SATELLITE_TRACKER_API_KEY=your_api_key

# Data Source Configuration
USE_MOCK_DATA=true

# Update Intervals (in seconds)
SATELLITE_UPDATE_INTERVAL=30
COLLISION_CHECK_INTERVAL=60

# Server Configuration
PORT=5000
NODE_ENV=development
```

### API Keys Setup

1. **Space-Track.org** (Optional)
   - Register at https://www.space-track.org
   - Add credentials to `.env` file

2. **N2YO API** (Optional)
   - Get free API key at https://www.n2yo.com/api/
   - Add to `.env` file

3. **Satellite Tracker API** (Optional)
   - Configure your preferred satellite tracking API
   - Add API key to `.env` file

## 🏗️ Project Structure

```
space-traffic-dashboard/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── index.css      # Global styles
│   └── package.json
├── server/                # Node.js backend
│   ├── services/          # API services
│   ├── index.js           # Main server file
│   └── package.json
├── package.json           # Root package.json
├── vercel.json           # Vercel configuration
└── README.md
```

## 🔧 Available Scripts

### Root Directory
- `npm run dev` - Start both frontend and backend
- `npm run server` - Start backend only
- `npm run client` - Start frontend only
- `npm run install-all` - Install all dependencies

### Backend (server/)
- `npm run dev` - Start with nodemon
- `npm start` - Start production server

### Frontend (client/)
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests

## 📡 API Endpoints

### Health Check
- `GET /api/health` - System health status

### Satellite Data
- `GET /api/satellites` - Get all satellite data
- `GET /api/stats` - Get system statistics

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/logs` - Get API logs

### WebSocket Events
- `satellites` - Real-time satellite updates
- `alerts` - Real-time alert notifications

## 🚀 Deployment

### Vercel Deployment

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Configure Environment Variables**
   - Add environment variables in Vercel dashboard
   - Set `USE_MOCK_DATA=true` for demo deployment

3. **Deploy**
   - Vercel will automatically build and deploy
   - Access your live dashboard

### Manual Deployment

```bash
# Build frontend
cd client
npm run build

# Deploy backend
cd ../server
npm start
```

## 🎯 Features in Detail

### Real-time Monitoring
- **WebSocket Connection**: Live data updates every 30 seconds
- **Satellite Movement**: Simulated orbital movement for realistic tracking
- **Status Updates**: Real-time altitude and velocity monitoring

### Collision Detection
- **Proximity Analysis**: 3D distance calculation between satellites
- **Risk Assessment**: Automatic severity classification
- **Alert Generation**: Instant notifications for potential risks

### Data Visualization
- **Interactive Map**: Click satellites for detailed information
- **Status Legend**: Color-coded altitude and velocity indicators
- **Real-time Stats**: Live system performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Space-Track.org** for satellite tracking data
- **N2YO** for satellite API services
- **React Leaflet** for map functionality
- **Tailwind CSS** for styling framework
- **Vercel** for hosting and deployment

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: your-email@example.com
- Documentation: [Wiki](https://github.com/yourusername/space-traffic-dashboard/wiki)

---

**Made with ❤️ for space exploration and traffic management**
