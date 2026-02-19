import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { validatePrompt } from './chat.validation.js';
import { newPrompt, prompt } from './chat.controller.js';

const router: Router = Router();

router.post('/new/prompt', authMiddleware, validatePrompt, newPrompt);
router.post('/:id/prompt', authMiddleware, validatePrompt, prompt);

export default router;
