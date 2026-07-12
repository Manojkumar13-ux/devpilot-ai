import { Router, IRouter } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getAnalytics } from '../controllers/analytics.controller.js';

const router: IRouter = Router();

router.get('/', authenticate, getAnalytics);

export default router;
