import {sendEmail} from "@/libs/mail";
import {NextRequest} from "next/server";

export async function GET(req:NextRequest) {
  const url = new URL(req.url);
  if (!url.searchParams.get('y')) {
    return;
  }
  await sendEmail(['dawid.paszko@gmail.com'], 'test subject 2', 'test body');
  return Response.json(true);
}