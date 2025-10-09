# Fastest Route Analyzer

A modern web application for route planning and analysis using OpenStreetMap data with a beautiful, responsive UI.

## Features

- 🗺️ **Interactive Map**: OpenStreetMap integration with Leaflet.js
- 🚗 **Real Street Routing**: Uses OSRM (Open Source Routing Machine) for accurate street-level routing
- 📱 **Responsive Design**: Modern Material Design UI that works on all devices
- ⚡ **Real-time Calculations**: Distance, duration, and speed calculations
- 💾 **Route History**: Save and recall recent routes
- 🎯 **Multiple Input Methods**: Click on map, type addresses, or use current location
- 🔄 **Route Options**: Avoid tolls, highways, and other preferences
- 🌐 **Multiple Routing Services**: Fallback to different routing providers for reliability
- 📊 **Service Status**: Real-time indication of which routing service is active

## Project Structure

```
FastestRouteAnalyzer/
│
├── main.cpp                 # Original C++ implementation
├── include/                 # C++ headers
│   ├── Graph.h
│   └── Dijkstra.h
├── src/                     # C++ source files
│   ├── Graph.cpp
│   └── Dijkstra.cpp
├── web/                     # Web application
│   ├── index.html           # Main HTML file
│   ├── styles.css           # CSS styles
│   └── app.js              # JavaScript application
├── backend/                 # Node.js backend API
│   ├── server.js            # Express server
│   ├── package.json         # Node.js dependencies
│   └── env.example          # Environment configuration
└── README.md               # This file
```

## Quick Start

### Web Application (Recommended)

1. **Open the web application**:
   ```bash
   # Simply open the HTML file in your browser
   open web/index.html
   # or
   # Double-click on web/index.html
   ```

2. **Start the backend API** (optional, for enhanced features):
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **Access the application**:
   - Frontend: Open `web/index.html` in your browser
   - Backend API: http://localhost:3000

### C++ Implementation

1. **Compile the C++ version**:
   ```bash
   g++ -std=c++11 -I./include -o FastestRouteAnalyzer main.cpp src/Graph.cpp src/Dijkstra.cpp
   ```

2. **Run the C++ version**:
   ```bash
   ./FastestRouteAnalyzer
   ```

## Usage

### Web Application

1. **Select Start Location**:
   - Type an address in the "Start Location" field
   - Click on the map to set the start point
   - Use the "My Location" button for current position

2. **Select Destination**:
   - Type an address in the "Destination" field
   - Click on the map to set the end point

3. **Configure Route Options**:
   - Check "Avoid Tolls" to avoid toll roads
   - Check "Avoid Highways" to prefer local roads

4. **Find Route**:
   - Click "Find Route" to calculate the optimal path
   - View route details, distance, and duration
   - See turn-by-turn instructions

5. **Manage Routes**:
   - Use "Clear Route" to reset the map
   - View recent routes in the sidebar
   - Swap start and end locations

### API Endpoints

The backend provides the following REST API endpoints:

- `GET /health` - Health check
- `POST /api/geocode` - Convert address to coordinates
- `POST /api/reverse-geocode` - Convert coordinates to address
- `POST /api/route` - Calculate route between two points
- `POST /api/distance-matrix` - Calculate distances between multiple points

## Technologies Used

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with Flexbox and Grid
- **JavaScript (ES6+)**: Modern JavaScript features
- **Leaflet.js**: Interactive map library
- **Material Design**: Google's design system
- **OpenStreetMap**: Free map data

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **Axios**: HTTP client for API calls
- **Node-Cache**: In-memory caching
- **Helmet**: Security middleware
- **CORS**: Cross-origin resource sharing

### C++ Implementation
- **STL**: Standard Template Library
- **Dijkstra's Algorithm**: Shortest path algorithm
- **Adjacency List**: Graph representation

## Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
OPENROUTESERVICE_API_KEY=your_api_key_here
```

### Routing Services

The application uses multiple routing services with automatic fallback:

1. **OSRM (Primary)**: Open Source Routing Machine - Free, reliable, and accurate
2. **GraphHopper**: Free tier available with good coverage
3. **Mapbox**: Free tier available with high-quality routing
4. **Simulated Route**: Fallback that generates realistic waypoints when external services fail

### API Keys

For enhanced routing features, get a free API key from:
- [OpenRouteService](https://openrouteservice.org/) - For routing and geocoding
- [GraphHopper](https://graphhopper.com/) - For routing (free tier available)
- [Mapbox](https://mapbox.com/) - For routing (free tier available)
- [Nominatim](https://nominatim.org/) - For geocoding (free, no key required)

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

## Roadmap

- [ ] Real-time traffic data integration
- [ ] Multiple route options display
- [ ] Offline map support
- [ ] Mobile app development
- [ ] Advanced route optimization
- [ ] Integration with other map providers
- [ ] User accounts and saved routes
- [ ] Route sharing functionality
