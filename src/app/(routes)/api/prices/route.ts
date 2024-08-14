import {getCryptoPrices} from "@/libs/cryptoPrices";

export async function GET() {
  return Response.json(await getCryptoPrices());
}