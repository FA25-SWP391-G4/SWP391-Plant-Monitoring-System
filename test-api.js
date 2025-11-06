const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3010,
  path: '/api/plants/24',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjY0OGExZjQtMjAzZS00ZjcxLTlhYzQtNGE0NDE4YjgxYWI4IiwiZW1haWwiOiJzb25pY3ByaW1lMTk2M0BnbWFpbC5jb20iLCJyb2xlIjoiUHJlbWl1bSIsImZhbWlseV9uYW1lIjoixJDhurduZyIsImdpdmVuX25hbWUiOiJQaMawxqFuZyBLaMO0aSBOZ3V5w6puIiwiZnVsbF9uYW1lIjoiUGjGsMahbmcgS2jDtGkgTmd1ecOqbiDEkOG6t25nIiwiaWF0IjoxNzYyMzk0MDE5LCJleHAiOjE3NjI0ODA0MTl9.0CTYSIt6jdXKNrIJIDwRg8z6GoX7AuHnJt7pXDuh8ZQ'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));
    try {
      const parsedData = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();