import path from 'path';
import { fileURLToPath } from 'url';
import app from './server/app.ts';
import { connectDB } from './server/src/config/db.ts';
import { seedMongoDatabase } from './server/src/seed/mongoSeed.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = 3000;

  // 1. Establish persistent MongoDB connection and seed demo datasets
  try {
    await connectDB();
    await seedMongoDatabase();
  } catch (err: any) {
    console.warn('⚠️ Database startup failure (falling back to graceful handling):', err?.message || err);
  }

  // 2. Vite Dev Server / Static Production Serving
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    const { default: express } = await import('express');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 LinkPulse Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
