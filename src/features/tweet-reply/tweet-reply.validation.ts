import { validateTimeString } from "../../shared/utils/time-parser.js";
import Joi from "joi";

export const tweetReplySchema = Joi.object({
  tweetUrls: Joi.array().items(Joi.string()).min(1),
  customInstructions: Joi.string(),
  maximumTime: Joi.string().trim().lowercase().custom(validateTimeString)
})

