import {CoinCode} from "@/libs/cryptoPrices";
import {prisma} from "@/libs/db";
import axios from "axios";
import {subSeconds} from "date-fns";

export const balanceSources = [
  async (coin:'btc'|'bch'|'ltc'|'eth', address:string) => {
    const blockchain = {btc: 'bitcoin', bch:'bitcoin-cash', ltc:'litecoin', eth:'ethereum'}[coin];
    const url = `https://rest.cryptoapis.io/blockchain-data/${blockchain}/mainnet/addresses/${address}/balance`;
    const response = await axios.get(url, {headers: {'x-api-key': process.env.CRYPTOAPIS_APIE_KEY}});
    const amount = response.data?.data?.item?.confirmedBalance?.amount as string;
    if ( ! /^[0-9]+\.?[0-9]*$/.test(amount) ) {
      throw 'balance validation error: '+amount;
    }
    return parseFloat(amount);
  },
];

export async function getCryptoBalance(coin:'btc'|'bch'|'ltc'|'eth', addressString:string, expSeconds=60) {

  // get cached if possible
  if (expSeconds > 0) {
    const addressWithCachedBalance = await prisma.address.findFirst({
      where:{address:addressString,code:coin,balanceUpdatedAt:{gte:subSeconds(new Date, expSeconds)}},
    });
    if (addressWithCachedBalance) {
      return (addressWithCachedBalance.lastBalance10pow10 || 0) / 10**10;
    }
  }

  for (let source of balanceSources) {
    try {
      // get balance
      const amount = await source(coin, addressString);
      console.log({amount});
      if (amount) {
        const address = await prisma.address.findFirst({where:{address:addressString,code:coin}});
        if (address) {
          // save new amounts to db
          const oldBalance10pow10 = address.lastBalance10pow10 || 0;
          const newBalance10pow10 = amount*10**10;
          if (oldBalance10pow10 !== newBalance10pow10) {
            await prisma.balanceChange.create({
              data: {
                addressId: address.id,
                address: address.address,
                oldBalance10pow10,
                newBalance10pow10,
                balanceChange10pow10: newBalance10pow10 - oldBalance10pow10,
              }
            });
          }
          await prisma.address.update({
            data:{lastBalance10pow10:amount*10**10,balanceUpdatedAt:new Date},
            where:{address:addressString,code:coin},
          });
        }
      }
      return amount;
    } catch (e) {
      console.error(e);
    }
  }
}