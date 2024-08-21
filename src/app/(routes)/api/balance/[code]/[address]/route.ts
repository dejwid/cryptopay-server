import {balanceSources} from "@/libs/cryptoBalances";

export async function GET() {
  return Response.json(
    await balanceSources[0].getBalance('bch', 'qzzqpq2qys34vc8lhfgfdtv9yrcjuwue9gyxds4rnt')
  );
}