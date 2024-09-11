import {SupportedCoin, testWallets} from "@/libs/config";
import {balanceSources} from "@/libs/cryptoBalances";
import {NextRequest} from "next/server";

export async function GET(req:NextRequest) {
  const url = new URL(req.url);
  if (!url.searchParams.get('y')) {
    return Response.json(false);
  }
  const coins = Object.keys(testWallets) as SupportedCoin[];
  let allResults:{[key: string] : number[]} = {};
  for (const coin of coins) {
    const wallet = testWallets[coin];
    const functions = balanceSources.filter(s => s.supportedCoins.includes(coin));
    const results:number[] = [];
    for (const f of functions) {
      results.push(await f.getBalance(coin, wallet));
    }
    const allEqual = results.length > 0 ? results.every(r => r === results[0]) : false;
    if (!allEqual) {
      console.error(results);
      throw `All not equal for ${coin} : ${results.join(' = ')}`;
    }
    allResults[coin] = results;
  }
  return Response.json(allResults);
}