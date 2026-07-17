import { XService } from "../../shared/services/x.service.js";
import { XApiPostResponse } from "../tweet-reply/tweet-reply.types.js";

export async function publishPost(
  accessToken: string,
  message: string,
  files?: Express.Multer.File[],
): Promise<XApiPostResponse> {
  const xService = new XService(accessToken);

  if (files?.length) {
    const mediaIds = await Promise.all(
      files.map((f) => xService.postMedia(f.buffer, f.mimetype)),
    );
    return xService.post(message, { media_ids: mediaIds });
  }

  return xService.post(message);
}
