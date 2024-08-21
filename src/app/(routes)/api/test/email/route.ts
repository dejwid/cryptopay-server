import {sendEmail} from "@/libs/mail";

export async function GET() {
  await sendEmail(['dawid.paszko@gmail.com'], 'test subject 2', 'test body');
  return Response.json(true);
}