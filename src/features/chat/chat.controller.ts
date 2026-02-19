import { Request, Response, NextFunction } from 'express';
import {
  createConversationWithMessage,
  addMessageToConversation,
} from './chat.service.js';

export async function newPrompt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { content, title } = req.body;
    const conversation = await createConversationWithMessage(userId, content, title);
    res.status(201).json(conversation);
  } catch (error) {
    next(error);
  }
}

export async function prompt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { id: conversationId } = req.params;
    const { content } = req.body;
    const message = await addMessageToConversation(conversationId, userId, content);
    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
}
