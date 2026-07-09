import { XService } from "../../shared/services/x.service.js";
import { XApiPostResponse } from "../tweet-reply/tweet-reply.types.js";

export async function publishPost(
  accessToken: string,
  message: string,
  file?: Express.Multer.File,
): Promise<XApiPostResponse> {
  const xService = new XService(accessToken);

  if (file) {
    const mediaId = await xService.postMedia(file.buffer, file.mimetype);
    return xService.post(message, { media_ids: [mediaId] });
  }

  return xService.post(message);
}
