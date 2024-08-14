import {coinToUsdClient, usdToCoinClient} from "@/libs/crypto-client";
import {redis} from "@/libs/redis";
import axios, {isAxiosError} from "axios";
import {z} from "zod";

const coinCodes = ['btc', 'bch', 'ltc', 'eth'] as const;

export type CoinCode = typeof coinCodes[number];
export type CryptoPrices = {
  btc: number;
  bch: number;
  ltc: number;
  eth: number;
};

const pricesSchemas = z.object({
  btc: z.number().min(20000).max(150000), // 64000
  bch: z.number().min(50).max(9999), // 300
});

const priceSources = [
  async () => {
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=${coinCodes.map(c => c.toUpperCase()).join(',')}`,
      {headers: {'X-CMC_PRO_API_KEY':process.env.COINMARKETCAP_API_KEY}}
    );
    const prices:Record<string,number> = {};
    Object.values(response.data.data).forEach((data:any) => {
      const coin = data[0].symbol.toLowerCase() as CoinCode;
      prices[coin] = data[0]?.quote?.USD?.price;
    });
    return prices;
  },
];

export async function getCryptoPrices(): Promise<Record<typeof coinCodes[number], number>> {
  const cachedPrices = await redis.get('cryptopay-server-prices');
  if (pricesSchemas.safeParse(cachedPrices).success){
    console.log('prices cache hit!', {cachedPrices});
    return cachedPrices as CryptoPrices;
  }
  let prices;
  for (let source of priceSources) {
    prices = await source();
    const validation = pricesSchemas.safeParse(prices);
    if (validation.success) {
      await redis.set('cryptopay-server-prices', prices, { ex: 3600 });
      return prices;
    }
  }
  throw 'no prices :(';
}

export async function usdToCoin(usdAmount:number,coin:CoinCode) {
  const cryptoPrices = await getCryptoPrices();
  return usdToCoinClient(usdAmount, cryptoPrices?.[coin]);
}

export async function coinToUsd(coinAmount:number, coin:CoinCode) {
  return coinToUsdClient(coinAmount, coin, await getCryptoPrices());
}