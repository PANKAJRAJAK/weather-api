const axios = require('axios');

const TEST_CASES = [
  {
    name: "Invalid city name",
    query: "XYZCity123",
    expectError: true
  },
  {
    name: "Empty string",
    query: "",
    expectError: true
  },
  {
    name: "Special characters",
    query: "@#$%",
    expectError: true
  },
  {
    name: "Numbers only",
    query: "12345",
    expectError: true
  },
  {
    name: "Valid but very specific",
    query: "Manali, Himachal Pradesh, IN",
    expectError: false
  }
];

async function testWeatherEndpoint() {
  console.log("\n=== Testing /weather endpoint ===");
  for (const test of TEST_CASES) {
    try {
      console.log(`\nTest: ${test.name}`);
      console.log(`Query: "${test.query}"`);
      
      const response = await axios.get(`http://localhost:3000/weather?cities=${encodeURIComponent(test.query)}`);
      const data = response.data;
      
      if (Array.isArray(data) && data.length > 0) {
        const result = data[0];
        if (result.error) {
          console.log("✓ Error received as expected:", result.error);
        } else {
          console.log("Result:", {
            city: result.city,
            temperature: result.temperature,
            weather: result.weather
          });
        }
      }
    } catch (error) {
      if (test.expectError) {
        console.log("✓ Error received as expected:", error.response?.data?.error || error.message);
      } else {
        console.log("✗ Unexpected error:", error.response?.data?.error || error.message);
      }
    }
  }
}

async function testForecastEndpoint() {
  console.log("\n=== Testing /forecast endpoint ===");
  for (const test of TEST_CASES) {
    try {
      console.log(`\nTest: ${test.name}`);
      console.log(`Query: "${test.query}"`);
      
      const response = await axios.get(`http://localhost:3000/forecast?city=${encodeURIComponent(test.query)}`);
      const data = response.data;
      
      if (data.error) {
        console.log("✓ Error received as expected:", data.error);
      } else {
        console.log("Result:", {
          city: data.city,
          country: data.country,
          forecast_days: data.forecast?.length
        });
      }
    } catch (error) {
      if (test.expectError) {
        console.log("✓ Error received as expected:", error.response?.data?.error || error.message);
      } else {
        console.log("✗ Unexpected error:", error.response?.data?.error || error.message);
      }
    }
  }
}

// Run tests
(async () => {
  try {
    await testWeatherEndpoint();
    await testForecastEndpoint();
  } catch (error) {
    console.error("Test execution failed:", error);
  }
})();