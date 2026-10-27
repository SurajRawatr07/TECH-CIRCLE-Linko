import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Fail fast on buffering so API calls do not hang if DB is disconnected
mongoose.set('bufferCommands', false);

let mongoMemoryServer: MongoMemoryServer | null = null;
let isConnected = false;

export async function connectDB(): Promise<typeof mongoose> {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  const explicitUri = process.env.MONGODB_URI;

  if (explicitUri) {
    try {
      console.log(`Connecting to MongoDB at configured MONGODB_URI...`);
      await mongoose.connect(explicitUri, {
        serverSelectionTimeoutMS: 5000,
      });
      isConnected = true;
      console.log(`✅ Connected to MongoDB Atlas/external database: ${mongoose.connection.host}`);
      return mongoose;
    } catch (err: any) {
      console.warn(`⚠️ Failed to connect to explicit MONGODB_URI: ${err.message}. Initializing embedded MongoDB engine...`);
    }
  }

  // Fallback to high-performance embedded MongoMemoryServer
  try {
    if (!mongoMemoryServer) {
      console.log('⚡ Starting high-performance embedded MongoDB server...');
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'linkpulse',
        },
      });
    }

    const uri = mongoMemoryServer.getUri();
    await mongoose.connect(uri);
    isConnected = true;
    console.log(`✅ Embedded MongoDB cluster active at ${uri} (db: linkpulse)`);
  } catch (memErr: any) {
    console.warn(`⚠️ Embedded MongoDB cluster could not be created (${memErr.message}). Continuing in offline mode.`);
  }

  return mongoose;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
  isConnected = false;
}

export function getDbStatus() {
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    status: isConnected ? 'healthy' : 'degraded',
    state: stateMap[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host || 'embedded-memory-server',
    port: mongoose.connection.port || 27017,
    name: mongoose.connection.name || 'linkpulse',
    isEmbedded: !process.env.MONGODB_URI,
  };
}
