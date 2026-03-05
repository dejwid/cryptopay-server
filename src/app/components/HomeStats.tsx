import {getUserEmail} from "@/app/actions/actions";
import {BchIcon, BtcIcon, EthIcon, LtcIcon} from "@/app/components/CryptoIcons";
import {supportedCoins} from "@/libs/config";
import {coinToUsdClient} from "@/libs/crypto-client";
import {CoinCode, coinToUsd, getCryptoPrices} from "@/libs/cryptoPrices";
import {prisma} from "@/libs/db";
import {sortBy} from "lodash";

export default async function HomeStats() {
  const addresses = await prisma.address.groupBy({
    by: ['code'],
    where: {
      userEmail: await getUserEmail() || '',
    },
    _sum: {
      lastBalance10pow10: true,
    },
  });
  const cryptoPrices = await getCryptoPrices();
  return (
    <>
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        {sortBy(addresses, dataItem => supportedCoins.indexOf(dataItem.code)).map(data => {
          const balance10pow10 = (data._sum.lastBalance10pow10 || 0)/10**10
          return (
            <div key={data.code} className="flex items-center bg-blue-50 p-3 sm:p-4 rounded-md border border-blue-200">
              <div className="shrink-0">
                {data.code === 'btc' && <BtcIcon className="size-8 sm:size-10" />}
                {data.code === 'bch' && <BchIcon className="size-8 sm:size-10" />}
                {data.code === 'ltc' && <LtcIcon className="size-8 sm:size-10" />}
                {data.code === 'eth' && <EthIcon className="size-8 sm:size-10" />}
              </div>
              <div className="grow text-right min-w-0 ml-3">
                <div className="text-lg sm:text-xl font-medium truncate">
                  {balance10pow10}&nbsp;{data.code.toUpperCase()}
                </div>
                <div className="text-sm sm:text-base text-gray-600">
                  ~{coinToUsdClient(balance10pow10, data.code as CoinCode, cryptoPrices).toFixed(4)}&nbsp;USD
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
