import { Router, IRouter } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { getLeaderboard } from '../controllers/leaderboard.controller.js';

const router: IRouter = Router();

router.get('/', authenticate, getLeaderboard);

export default router;
