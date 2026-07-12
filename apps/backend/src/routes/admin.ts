import { Router, IRouter } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../middleware/validate.js';
import {
  getStats, listUsers, updateUserRole, deleteUser,
  listAdminProblems, createProblem, updateProblem, updateProblemStatus, deleteProblem,
  updateTestCases, updateStarterCode, updateEditorial,
  listSubmissions, getAdminSubmission,
  listAiReviews, listInterviews,
} from '../controllers/admin.controller.js';

const router: IRouter = Router();

const isAdmin = async (req: AuthRequest, res: any, next: any) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

router.get('/stats', authenticate, isAdmin, getStats);
router.get('/users', authenticate, isAdmin, listUsers);
router.patch('/users/:id/role', authenticate, isAdmin, validate(schemas.admin.updateRole), updateUserRole);
router.delete('/users/:id', authenticate, isAdmin, deleteUser);

router.get('/problems', authenticate, isAdmin, listAdminProblems);
router.post('/problems', authenticate, isAdmin, validate(schemas.admin.createProblem), createProblem);
router.put('/problems/:id', authenticate, isAdmin, updateProblem);
router.patch('/problems/:id/status', authenticate, isAdmin, updateProblemStatus);
router.delete('/problems/:id', authenticate, isAdmin, deleteProblem);
router.put('/problems/:id/test-cases', authenticate, isAdmin, validate(schemas.admin.updateTestCases), updateTestCases);
router.put('/problems/:id/starter-code', authenticate, isAdmin, updateStarterCode);
router.put('/problems/:id/editorial', authenticate, isAdmin, updateEditorial);

router.get('/submissions', authenticate, isAdmin, listSubmissions);
router.get('/submissions/:id', authenticate, isAdmin, getAdminSubmission);

router.get('/ai-reviews', authenticate, isAdmin, listAiReviews);
router.get('/interviews', authenticate, isAdmin, listInterviews);

export default router;
