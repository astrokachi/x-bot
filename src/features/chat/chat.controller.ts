import { Request, Response, NextFunction } from 'express';
import {
  createConversationWithMessage,
  addMessageToConversation,
  getMessagesByConversation,
  getMessageTree as getMessageTreeService,
  refineMessage as refineMessageService,
} from './chat.service.js';
import { sendResponse } from '../../shared/utils/response.js';

export async function newPrompt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { content, type } = req.body;
    const result = await createConversationWithMessage(userId, content, type);
    sendResponse(res, 201, 'Conversation created successfully', result.data);
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
    const { content, type } = req.body;
    const result = await addMessageToConversation(conversationId as string, userId, content, type);
    sendResponse(res, 201, 'Message sent successfully', result.data);
  } catch (error) {
    next(error);
  }
}

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { id: conversationId } = req.params;
    const cursor = req.query.cursor as string | undefined;
    const take = parseInt(req.query.take as string) || 50;
    const result = await getMessagesByConversation(conversationId as string, userId, cursor, take);
    sendResponse(res, 200, 'Messages retrieved successfully', result.data, result.pagination);
  } catch (error) {
    next(error);
  }
}

export async function getMessageTree(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { messageId } = req.params;
    const result = await getMessageTreeService(messageId as string);
    sendResponse(res, 200, 'Message tree retrieved successfully', result.data);
  } catch (error) {
    next(error);
  }
}

export async function refineMessage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.user_id;
    const { id: conversationId, messageId } = req.params;
    const { content } = req.body;
    const result = await refineMessageService(conversationId as string, messageId as string, userId, content);
    sendResponse(res, 200, 'Message refined successfully', result.data);
  } catch (error) {
    next(error);
  }
}
