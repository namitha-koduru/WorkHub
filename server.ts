import express from 'express';
import { createServer as createViteServer } from 'vite';
import http from 'http';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env or server/.env
if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
} else if (fs.existsSync('server/.env')) {
  dotenv.config({ path: 'server/.env' });
} else {
  dotenv.config();
}

import app from './server/src/app.js';
import { connectDB } from './server/src/config/db.js';
import { initSocket } from './server/src/config/socket.js';

// Dev server must always bind to port 3000 (nginx listens on 8080 and proxies to 3000)
const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer() {
  const server = http.createServer(app);
  initSocket(server);

  // Attempt connection to MongoDB asynchronously
  connectDB().catch((err) => {
    console.warn('[Database Startup Notice]', err.message);
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve('dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.use((req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    // Mount Vite dev server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true, host: HOST },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Serve transformed index.html for React SPA client routes
    app.use(async (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`[WorkHub Full-Stack] Server running on http://${HOST}:${PORT}`);
    console.log(`[WorkHub Full-Stack] Health check: http://${HOST}:${PORT}/api/v1/health`);
  });
}

startServer().catch((err) => {
  console.error('[Fatal Server Startup Error]', err);
});
