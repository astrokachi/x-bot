import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../../config/s3.js";

export const getUploadUrl = async (key: string, mimeType: string) => {
  if (!process.env.AWS_S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET environment variable is not set");
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: mimeType,
  });

  // Expires in 60 seconds as per best practice
  return getSignedUrl(s3, command, { expiresIn: 60 });
};
