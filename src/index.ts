import express from 'express';
import dotenv from 'dotenv';
import { logger } from './logger';
import morgan from 'morgan';
import requestLogger from './middlewares/requestLogger';
import connectDB from './config/db';
import adminRoutes from './routes/adminRoutes';
dotenv.config();

const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Skip logging during tests
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'test';
};

// Use morgan middleware for logging HTTP requests
app.use(morgan('combined', { stream, skip }));
app.use(requestLogger);

// Routes
app.use('/api/v1/admin', adminRoutes);

app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});
