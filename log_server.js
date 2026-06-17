import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 5175;
const LOG_FILE = 'c:/Projects/Website/fitcraft3D/browser_logs.txt';

// Clear existing log file
try {
  fs.writeFileSync(LOG_FILE, '=== Browser Log Server Started ===\n');
} catch (err) {
  console.error('Failed to initialize log file:', err);
}

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      fs.appendFileSync(LOG_FILE, body);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Log server listening on port ${PORT}`);
});
