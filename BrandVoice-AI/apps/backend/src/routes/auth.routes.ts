import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router: Router = Router();

router.post('/register', (req, res, next) => authController.register(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));
router.post('/logout', (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticate, (req, res, next) => authController.me(req, res, next));
router.put('/profile', authenticate, (req, res, next) => authController.updateProfile(req, res, next));
router.put('/password', authenticate, (req, res, next) => authController.changePassword(req, res, next));
router.put('/organization', authenticate, (req, res, next) => authController.updateOrganization(req, res, next));

export default router;
