import {balanceSources} from "@/libs/cryptoBalances";
import axios from "axios";

export async function GET() {
  return Response.json(
    await balanceSources[0]('bch', 'qzzqpq2qys34vc8lhfgfdtv9yrcjuwue9gyxds4rnt')
  );
}