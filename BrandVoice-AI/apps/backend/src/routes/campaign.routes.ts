import { Router } from 'express';
import { campaignController } from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.get('/', authenticate, (req, res, next) => campaignController.list(req, res, next));
router.post('/', authenticate, (req, res, next) => campaignController.create(req, res, next));

export default router;
