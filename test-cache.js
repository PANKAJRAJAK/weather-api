const axios = require('axios');

async function run() {
  const lat = 32.2396;
  const lon = 77.1892; // Manali
  console.log('Requesting /weather/coords first time...');
  let start = Date.now();
  const w1 = await axios.get(`http://localhost:3000/weather/coords?lat=${lat}&lon=${lon}`);
  console.log('First weather response time:', Date.now()-start, 'ms');
  console.log(JSON.stringify(w1.data, null, 2));

  console.log('\nRequesting /weather/coords second time...');
  start = Date.now();
  const w2 = await axios.get(`http://localhost:3000/weather/coords?lat=${lat}&lon=${lon}`);
  console.log('Second weather response time:', Date.now()-start, 'ms');
  console.log(JSON.stringify(w2.data, null, 2));

  console.log('\nRequesting /forecast/coords first time...');
  start = Date.now();
  const f1 = await axios.get(`http://localhost:3000/forecast/coords?lat=${lat}&lon=${lon}`);
  console.log('First forecast response time:', Date.now()-start, 'ms');
  console.log('forecast days:', f1.data.forecast.length);

  console.log('\nRequesting /forecast/coords second time...');
  start = Date.now();
  const f2 = await axios.get(`http://localhost:3000/forecast/coords?lat=${lat}&lon=${lon}`);
  console.log('Second forecast response time:', Date.now()-start, 'ms');
  console.log('forecast days:', f2.data.forecast.length);
}

run().catch(e => console.error('Error during cache test:', e.message));