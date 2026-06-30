import { Router } from 'express';
import { authMiddleware } from '../../shared/middleware/auth.middleware.js';
import { validatePrompt, validateRefine } from './chat.validation.js';
import { newPrompt, prompt, getMessages, getMessageTree, refineMessage } from './chat.controller.js';

const router: Router = Router();

router.post('/new/prompt', authMiddleware, validatePrompt, newPrompt);
router.post('/:id/prompt', authMiddleware, validatePrompt, prompt);
router.get('/:id/messages', authMiddleware, getMessages);
router.get("/:id/messages/:messageId/tree", authMiddleware, getMessageTree);
router.post("/:id/messages/:messageId/refine", authMiddleware, validateRefine, refineMessage);

export default router;
