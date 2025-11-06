const request = require('supertest');
const app = require('../Weather');
const axios = require('axios');

jest.mock('axios');

describe('Weather API smoke tests', () => {
  beforeAll(() => {
    // Mock data for current weather
    const currentData = {
      name: 'TestCity',
      main: { temp: 12.34, feels_like: 11.0, humidity: 56 },
      wind: { speed: 2.5 },
      sys: { sunrise: 1600000000, sunset: 1600040000 },
      timezone: 0,
      weather: [{ description: 'clear sky' }]
    };

    // Mock data for forecast
    const forecastData = {
      city: { name: 'TestCity', country: 'TC', timezone: 0 },
      list: [
        { dt: 1600000000, main: { temp: 10 }, weather: [{ description: 'clouds' }], wind: { speed: 1 } },
        { dt: 1600030000, main: { temp: 14 }, weather: [{ description: 'clouds' }], wind: { speed: 3 } }
      ]
    };

    axios.get.mockImplementation((url) => {
      if (url.includes('/data/2.5/forecast')) return Promise.resolve({ data: forecastData });
      if (url.includes('/data/2.5/weather')) return Promise.resolve({ data: currentData });
      return Promise.reject(new Error('unexpected url'));
    });
  });

  test('GET /weather returns wind_speed in Km/hr string', async () => {
    const res = await request(app).get('/weather').query({ cities: 'TestCity' });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const city = res.body[0];
    expect(city.city).toBe('TestCity');
    expect(typeof city.wind_speed).toBe('string');
    expect(city.wind_speed).toMatch(/Km\/hr$/);
  });

  test('GET /forecast returns forecast with wind_speed strings', async () => {
    const res = await request(app).get('/forecast').query({ city: 'TestCity' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('forecast');
    const day = res.body.forecast[0];
    expect(typeof day.wind_speed === 'string' || day.wind_speed === null).toBeTruthy();
  });
});
