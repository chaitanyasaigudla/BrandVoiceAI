import { Router } from 'express';
import { consistencyController } from '../controllers/consistency.controller';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.post('/check', authenticate, (req, res, next) => consistencyController.check(req, res, next));
router.post('/improve', authenticate, (req, res, next) => consistencyController.improve(req, res, next));
router.get('/history', authenticate, (req, res, next) => consistencyController.history(req, res, next));

export default router;
