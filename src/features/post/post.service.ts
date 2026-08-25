import { XService } from "../../shared/services/x.service.js";

export async function publishPost(
  accessToken: string,
  message: string,
  files?: Express.Multer.File[],
) {
  const xService = new XService(accessToken);

  if (files?.length) {
    const mediaIds = await Promise.all(
      files.map((f) => xService.uploadMedia(f.buffer, f.mimetype)),
    );
    return xService.createPost(message, undefined, mediaIds);
  }

  return xService.createPost(message);
}
