import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { taskStatusSummary, taskStatusSummaryExplain } from '../controllers/analytics.controller.js';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get('/tasks/status-summary', taskStatusSummary);
analyticsRouter.get('/tasks/status-summary/explain', taskStatusSummaryExplain);

