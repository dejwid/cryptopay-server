import {createWallet} from "@/libs/cryptoWalletGenerators";

export async function GET() {
  return Response.json({
    btc: createWallet('btc'),
    bch: createWallet('bch'),
    ltc: createWallet('ltc'),
    doge: createWallet('doge'),
    eth: createWallet('eth'),
  });
}