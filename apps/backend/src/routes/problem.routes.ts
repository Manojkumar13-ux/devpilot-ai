import { Router, IRouter } from 'express';
import { 
  getProblems, 
  getProblemBySlug, 
  getProblemById,
  getProblemStarterCode 
} from '../controllers/problem.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router: IRouter = Router();

// Get all problems (with pagination and filters)
router.get('/', authenticate, getProblems);

// Get problem by slug
router.get('/slug/:slug', authenticate, getProblemBySlug);

// Get problem by ID
router.get('/:id', authenticate, getProblemById);

// Get starter code for a problem
router.get('/:id/starter', authenticate, getProblemStarterCode);

export default router;
