import { Router } from 'express';
import { memoryController } from '../controllers/memory.controller';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.get('/', authenticate, (req, res, next) => memoryController.list(req, res, next));
router.post('/search', authenticate, (req, res, next) => memoryController.search(req, res, next));
router.post('/', authenticate, (req, res, next) => memoryController.create(req, res, next));

export default router;
