// Production Full-Stack Server for Render / Cloud Deployments
// Mounts Express REST API, MongoDB Mongoose Connection, and SPA Static Assets
const http = require('http');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
} else if (fs.existsSync('server/.env')) {
  dotenv.config({ path: 'server/.env' });
} else {
  dotenv.config();
}

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

async function bootstrap() {
  try {
    // Import ES modules dynamically
    const { default: app } = await import('./server/src/app.js');
    const { connectDB } = await import('./server/src/config/db.js');
    const { initSocket } = await import('./server/src/config/socket.js');

    // Connect to MongoDB
    await connectDB();

    const server = http.createServer(app);
    initSocket(server);

    server.listen(PORT, HOST, () => {
      console.log(`[WorkHub Production] Server running on http://${HOST}:${PORT}`);
      console.log(`[WorkHub Production] API Health check: http://${HOST}:${PORT}/api/v1/health`);
    });
  } catch (err) {
    console.error('[WorkHub Production] Error during server bootstrap, starting static fallback:', err);

    // Fallback simple HTTP server if dependencies are compiling
    const simpleServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'Starting', error: err.message }));
    });
    simpleServer.listen(PORT, HOST);
  }
}

bootstrap();
