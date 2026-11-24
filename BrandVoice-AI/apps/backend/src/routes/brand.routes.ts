import { Router } from 'express';
import { brandController } from '../controllers/brand.controller';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.get('/', authenticate, (req, res, next) => brandController.listBrands(req, res, next));
router.post('/', authenticate, (req, res, next) => brandController.createBrand(req, res, next));
router.get('/current', authenticate, (req, res, next) => brandController.getCurrentBrand(req, res, next));
router.get('/:id', authenticate, (req, res, next) => brandController.getBrandById(req, res, next));
router.post('/crawl', authenticate, (req, res, next) => brandController.crawlWebsite(req, res, next));
router.put('/:id', authenticate, (req, res, next) => brandController.updateBrand(req, res, next));
router.delete('/:id', authenticate, (req, res, next) => brandController.deleteBrand(req, res, next));
router.put('/:id/guidelines', authenticate, (req, res, next) => brandController.updateGuidelines(req, res, next));
router.put('/:id/preferences', authenticate, (req, res, next) => brandController.updatePreferences(req, res, next));

export default router;
