import { Router, IRouter } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getProfile, updateProfile, updateStats, getStats } from '../controllers/profile.controller.js';

const router: IRouter = Router();

router.get('/', authenticate, getProfile);
router.patch('/', authenticate, updateProfile);
router.patch('/stats', authenticate, updateStats);
router.get('/stats', authenticate, getStats);

export default router;
