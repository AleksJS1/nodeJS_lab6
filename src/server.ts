import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { connectDB, disconnectDB } from './config/database';
import http from 'http';

const PORT = Number(process.env.PORT) || 3000;

let server: http.Server;

const shutdown = (signal: 'SIGTERM' | 'SIGINT'): void => {
  console.log(`${signal} received, shutting down gracefully...`);

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(async () => {
    console.log('HTTP server closed');

    try {
      await disconnectDB();
      console.log('Database connection closed');
      process.exit(0);
    } catch (err) {
      console.error('Error disconnecting from database:', err);
      process.exit(1);
    }
  });
};

async function startServer(): Promise<void> {
  try {
    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    void connectDB().catch((err) => {
      console.error('MongoDB connection failed during startup:', err);
    });

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
