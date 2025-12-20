# Mausam Weather App

A modern weather application built with Node.js, Express, and Tailwind CSS. Provides real-time weather data and forecasts using the OpenWeatherMap API.

## Features

- Current weather and 5-day forecast
- City geocoding and location services
- Responsive design with dynamic backgrounds
- In-memory caching for improved performance

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- OpenWeatherMap API key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PANKAJRAJAK/weather-api.git
   cd weather-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the frontend:**
   ```bash
   npm run tailwind:build
   ```

4. **Set API key:**
   ```bash
   export OPENWEATHER_API_KEY=your_api_key_here
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

6. **Open your browser:**
   Navigate to `http://localhost:3000`

## API Endpoints

- `GET /` - Main application
- `GET /weather?cities={city}` - Current weather
- `GET /forecast?city={city}` - 5-day forecast

## Development

- `npm run dev` - Development mode with auto-rebuilding CSS
- `npm test` - Run tests

## License

ISC License
