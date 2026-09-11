import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import researchAreaRoutes from './routes/researchAreas.js';
import facultyRoutes from './routes/faculty.js';
import studentInterestRoutes from './routes/studentInterests.js';
import facultySlotRoutes from './routes/facultySlots.js';
import facultyResearchAreaRoutes from './routes/facultyResearchAreas.js';
import recommendationRoutes from './routes/recommendations.js';
import adminRoutes from './routes/admin.js';
import requestRoutes from './routes/requests.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/research-areas', researchAreaRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student-interests', studentInterestRoutes);
app.use('/api/faculty-slots', facultySlotRoutes);
app.use('/api/faculty-research-areas', facultyResearchAreaRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/requests', requestRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/supervisor_match';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
