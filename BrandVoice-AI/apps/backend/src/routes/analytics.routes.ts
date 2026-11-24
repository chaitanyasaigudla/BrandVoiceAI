import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.get('/dashboard', authenticate, (req, res, next) => analyticsController.getDashboardStats(req, res, next));
router.get('/trends', authenticate, (req, res, next) => analyticsController.getTrends(req, res, next));

export default router;
