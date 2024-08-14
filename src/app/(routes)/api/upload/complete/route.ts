import {prisma} from "@/libs/db";
import {getS3Client, s3Config} from "@/libs/s3";
import {NextRequest} from "next/server";

export async function POST(req: NextRequest) {
  const data = await req.json();
  const s3 = getS3Client();
  const partsResult = await s3.listParts({
    Bucket: s3Config.bucket,
    Key: data.key,
    UploadId: data.uploadId,
  }).promise();
  const result = await s3.completeMultipartUpload({
    Bucket: s3Config.bucket,
    Key: data.key,
    UploadId: data.uploadId,
    MultipartUpload: {
      Parts: (partsResult.Parts || []).map(({PartNumber,ETag}) => ({PartNumber,ETag})),
    },
  }).promise();

  const info = await s3.headObject({
    Bucket: s3Config.bucket,
    Key: data.key,
  }).promise();

  const upload = await prisma.upload.create({
    data: {
      location: result.Location || '',
      size: info.ContentLength || null,
    },
  });

  return Response.json({
    ...result, ...upload,
  });
}