# Mausam Weather App

A modern, full-stack weather application built with Node.js, Express, and Tailwind CSS. Provides real-time weather data and forecasts using the OpenWeatherMap API.

## 🌟 Features

- **Current Weather**: Get real-time weather conditions for any city
- **5-Day Forecast**: Detailed weather predictions with temperature, humidity, and wind data
- **Geocoding**: Intelligent city name disambiguation
- **Location Services**: Browser geolocation with IP-based fallback
- **Responsive Design**: Mobile-friendly interface with dynamic backgrounds
- **Caching**: In-memory coordinate caching for improved performance

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenWeatherMap API key ([Get one here](https://openweathermap.org/api))

### Local Development

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

4. **Set environment variables:**
   ```bash
   export OPENWEATHER_API_KEY=your_api_key_here
   ```

5. **Start the development server:**
   ```bash
   npm start
   ```

6. **Open your browser:**
   Navigate to `http://localhost:80` to access the application.

### Development Mode
For active development with auto-rebuilding CSS:
```bash
npm run dev
```

## 🏗️ Architecture

- **Backend**: Node.js + Express server
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **API**: OpenWeatherMap integration
- **Styling**: Utility-first CSS framework
- **Deployment**: AWS Amplify (frontend/backend)

## 📋 API Endpoints

- `GET /` - Serve the main application
- `GET /weather?cities={city}` - Current weather data
- `GET /forecast?city={city}` - 5-day weather forecast

## 🔧 Configuration

### Environment Variables
- `OPENWEATHER_API_KEY`: Your OpenWeatherMap API key (required)
- `PORT`: Server port (default: 80)

### Build Scripts
- `npm start`: Start the production server
- `npm run dev`: Start development server with CSS watching
- `npm run tailwind:build`: Build CSS for production
- `npm run tailwind:watch`: Watch and rebuild CSS on changes
- `npm test`: Run test suite

## 🚢 Deployment

### AWS Amplify
The application is configured for deployment on AWS Amplify with automatic builds from the main branch.

1. Connect your GitHub repository to AWS Amplify
2. Set the `OPENWEATHER_API_KEY` environment variable in Amplify console
3. Deploy automatically on push to main branch

### Manual Deployment
For other platforms, ensure the following:
- Build Tailwind CSS before deployment
- Set the `OPENWEATHER_API_KEY` environment variable
- Configure the server to listen on the appropriate port

## 📝 Notes

- The application uses in-memory caching for coordinates, which resets on server restart
- For production deployments, consider using Redis for persistent caching
- API rate limits apply based on your OpenWeatherMap plan

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenWeatherMap](https://openweathermap.org/) for weather data
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Express.js](https://expressjs.com/) for the web framework
