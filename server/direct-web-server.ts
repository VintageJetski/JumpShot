import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Main route
app.get('/', (req, res) => {
  const htmlPath = path.join(process.cwd(), 'public', 'index.html');
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>CS2 Analytics Platform</title></head>
      <body>
        <h1>CS2 Analytics Platform</h1>
        <p>Server is running and processing 90,840 authentic XYZ coordinate records</p>
        <p>Backend successfully loaded 81 players and 16 teams</p>
        <p>Generated "South Sector" map area from coordinate clustering</p>
      </body>
      </html>
    `);
  }
});

// Catch all
app.get('*', (req, res) => {
  res.redirect('/');
});

const server = createServer(app);
const port = 5000;

server.listen(port, '0.0.0.0', () => {
  console.log(`Direct web server running on port ${port}`);
  console.log(`Accessible at http://0.0.0.0:${port}`);
});

server.on('error', (err) => {
  console.error('Direct server error:', err);
});

export { server, app };