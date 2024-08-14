import {S3} from "aws-sdk";

export const s3Config = {
  accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
  region: process.env.S3_REGION as string,
  bucket: process.env.S3_BUCKET as string,
};

export function getS3Client() {
  return new S3({
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
    },
    region: process.env.S3_REGION as string,
  });
}