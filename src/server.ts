import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { connectDB, disconnectDB } from './config/database';
import http from 'http';

const PORT = Number(process.env.PORT) || 3000;

let server: http.Server;

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB before starting server
    await connectDB();

    server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    // Graceful shutdown on SIGTERM
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      
      if (server) {
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
      }
    });

    // Graceful shutdown on SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      
      if (server) {
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
      }
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
