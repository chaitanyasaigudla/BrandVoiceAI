import { Router } from 'express';
import { contentController } from '../controllers/content.controller';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.post('/generate', authenticate, (req, res, next) => contentController.generate(req, res, next));
router.get('/', authenticate, (req, res, next) => contentController.list(req, res, next));
router.get('/:id/versions', authenticate, (req, res, next) => contentController.versions(req, res, next));
router.get('/:id', authenticate, (req, res, next) => contentController.getById(req, res, next));
router.patch('/:id/status', authenticate, (req, res, next) => contentController.updateStatus(req, res, next));
router.put('/:id', authenticate, (req, res, next) => contentController.update(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => contentController.delete(req, res, next));

export default router;
