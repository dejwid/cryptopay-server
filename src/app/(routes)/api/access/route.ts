import {isFirstTimeProductCodeUse} from "@/app/actions/actions";
import {getSession} from "@/app/actions/sessionActions";
import {NextRequest} from "next/server";

export async function GET(req:NextRequest) {
  const url = new URL(req.url);
  const productId = url.searchParams.get('productId') as string;
  const accessCode = url.searchParams.get('accessCode') as string;
  if (await isFirstTimeProductCodeUse(productId,accessCode)) {
    const session = await getSession();
    session.productId = productId;
    session.accessCode = accessCode;
    await session.save();
    return Response.json(true);
  }
  return Response.json(false);
}