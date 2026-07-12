import { Router, IRouter } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, schemas } from '../middleware/validate.js';
import { getSettings, updateSettings, changePassword, deleteAccount } from '../controllers/settings.controller.js';

const router: IRouter = Router();

router.get('/', authenticate, getSettings);
router.patch('/', authenticate, updateSettings);
router.post('/change-password', authenticate, validate(schemas.settings.changePassword), changePassword);
router.delete('/account', authenticate, validate(schemas.settings.deleteAccount), deleteAccount);

export default router;
