import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import entityRouter from './routes/entity';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.get('/health', (_req, res) => {
  const readyState = mongoose.connection.readyState;
  const isConnected = readyState === 1;

  res.status(isConnected ? 200 : 503).json({
    status: isConnected ? 'ok' : 'unavailable',
    database: {
      readyState,
      connected: isConnected,
    },
  });
});

app.use(cors());
app.use(express.json());

app.use('/api/books', entityRouter);

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

export default app;
