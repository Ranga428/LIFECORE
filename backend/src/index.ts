import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import trackerRoutes from './routes/trackers.js';
import eventRoutes from './routes/events.js';
import workoutRoutes from './routes/workouts.js';
import nutritionRoutes from './routes/nutrition.js';
import financeRoutes from './routes/finance.js';
import medicineRoutes from './routes/medicine.js';
import audioRoutes from './routes/audio.js';
import templateRoutes from './routes/templates.js';
import aiRoutes from './routes/ai.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/trackers', trackerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/medicine', medicineRoutes);
app.use('/api/audio', audioRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/ai', aiRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 LifeCore API running on port ${PORT}`);
});

export default app;