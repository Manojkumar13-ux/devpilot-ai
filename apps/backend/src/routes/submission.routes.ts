import { Router, IRouter } from 'express';
import {
  runCode,
  submitCode,
  getSubmissionStatus,
  getSubmissions,
  getSubmissionById,
  getSubmissionReview,
  getInterview,
  generateInterview,
  submitInterviewAnswer,
} from '../controllers/submission.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../middleware/validate.js';

const router: IRouter = Router();

// Run code (visible tests only)
router.post('/run', authenticate, validate(schemas.submission.run), runCode);

// Submit code (all tests including hidden)
router.post('/submit', authenticate, validate(schemas.submission.submit), submitCode);

// Get all submissions for current user
router.get('/', authenticate, getSubmissions);

// Get submission status
router.get('/:submissionId/status', authenticate, getSubmissionStatus);

// Get AI review for a submission
router.get('/:submissionId/review', authenticate, getSubmissionReview);

// Interview: generate question
router.post('/:submissionId/interview', authenticate, generateInterview);

// Interview: get existing
router.get('/:submissionId/interview', authenticate, getInterview);

// Interview: submit answer
router.post('/:submissionId/interview-answer', authenticate, validate(schemas.submission.interviewAnswer), submitInterviewAnswer);

// Get submission by ID
router.get('/:submissionId', authenticate, getSubmissionById);

export default router;
