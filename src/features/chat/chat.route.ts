import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { validatePrompt } from './chat.validation.js';
import { newPrompt, prompt, getMessages } from './chat.controller.js';

const router: Router = Router();

router.post('/new/prompt', authMiddleware, validatePrompt, newPrompt);
router.post('/:id/prompt', authMiddleware, validatePrompt, prompt);
router.get('/:id/messages', authMiddleware, getMessages);

export default router;
