import express from 'express';
import swaggerUi from 'swagger-ui-express';
import feedbackRouter from './routes/feedback.js';
import healthRouter from './routes/health.js';
import { swaggerSpec } from './swagger.js';

export const app = express();

app.set('trust proxy', 1);

app.use(express.json({ limit: '100kb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api', healthRouter);
app.use('/api', feedbackRouter);
