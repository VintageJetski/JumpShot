import express from "express";
import path from "path";

const app = express();

// Basic JSON response test
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working', timestamp: new Date().toISOString() });
});

// Static file serving
app.use(express.static(path.join(process.cwd(), 'client')));

const port = 5000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${port}`);
  console.log(`Test endpoint: http://0.0.0.0:${port}/test`);
});