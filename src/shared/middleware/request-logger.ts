import morgan from "morgan";
import logger from "../utils/logger.js";
import { Request, Response } from "express";

const requestLogger = morgan((tokens, req: Request, res: Response) => {
  const logObject = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    content_length: tokens.res(req, res, "content-length"),
    response_time: Number(tokens["response-time"](req, res)),
    user_agent: tokens["user-agent"](req, res),
  };

  logger.info(logObject, "Incoming Request");

  return null;
});

export default requestLogger;
