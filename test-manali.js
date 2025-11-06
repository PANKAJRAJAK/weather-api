const axios = require('axios');

(async () => {
  try {
    const w = await axios.get('http://localhost:3000/weather?cities=Manali,Himachal%20Pradesh,IN');
    console.log('=== /weather response ===');
    console.log(JSON.stringify(w.data, null, 2));

    const f = await axios.get('http://localhost:3000/forecast?city=Manali,Himachal%20Pradesh,IN');
    console.log('=== /forecast response ===');
    console.log(JSON.stringify(f.data, null, 2));
  } catch (err) {
    console.error('Request failed:', err.message);
    if (err.response) console.error('Status:', err.response.status, 'Data:', err.response.data);
  }
})();