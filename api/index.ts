import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Import routes
import authRoutes from '../backend/src/routes/auth.routes';
import formRoutes from '../backend/src/routes/form.routes';
import questionRoutes from '../backend/src/routes/question.routes';
import responseRoutes from '../backend/src/routes/response.routes';
import exportRoutes from '../backend/src/routes/export.routes';

const app = express();
export const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api', (req: Request, res: Response) => {
  res.json({ 
    message: 'Form Builder API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes - Remove /api prefix since Vercel handles routing
app.use('/auth', authRoutes);
app.use('/forms', formRoutes);
app.use('/questions', questionRoutes);
app.use('/responses', responseRoutes);
app.use('/export', exportRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal Server Error'
  });
});

// Export for Vercel serverless
export default app;
