import {getS3Client} from "@/libs/s3";
import {NextRequest} from "next/server";
import uniqid from "uniqid";

const chunkSize = 1024 * 1024 * 5;

export async function POST(req: NextRequest) {
  const data = await req.json();
  const s3 = getS3Client();
  const upload = await s3.createMultipartUpload({
    Bucket: process.env.S3_BUCKET as string,
    Key: uniqid() + '-' + data.filename,
    ACL: 'public-read',
  }).promise();
  const promises = [];
  const partsCount = Math.ceil(Number(data.size) / chunkSize);
  for (let i = 0; i < partsCount; i++) {
    promises.push(
      s3.getSignedUrl('uploadPart', {
        Bucket: process.env.S3_BUCKET as string,
        Key: upload.Key,
        UploadId: upload.UploadId,
        PartNumber: i + 1,
        Expires: 60 * 60,
      })
    );
  }
  const urls = await Promise.all(promises);
  return Response.json({
    ...upload, urls,
  });
}