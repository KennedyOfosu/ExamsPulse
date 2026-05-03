import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import uploadRouter from './routes/upload.js';
import generateRouter from './routes/generate.js';
import sessionsRouter from './routes/sessions.js';
import gradeRouter from './routes/grade.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = ['http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '50mb' }));

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/api/upload', uploadRouter);
app.use('/api/generate', generateRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/grade', gradeRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`ExamsPulse server running on port ${PORT}`));
