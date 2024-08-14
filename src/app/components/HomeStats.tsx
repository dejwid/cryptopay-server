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
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {sortBy(addresses, dataItem => supportedCoins.indexOf(dataItem.code)).map(data => {
          const balance10pow10 = (data._sum.lastBalance10pow10 || 0)/10**10
          return (
            <div key={data.code} className="flex items-center bg-blue-50 p-4 rounded-md border border-blue-200">
              <div>
                {data.code === 'btc' && <BtcIcon className="size-10" />}
                {data.code === 'bch' && <BchIcon className="size-10" />}
                {data.code === 'ltc' && <LtcIcon className="size-10" />}
                {data.code === 'eth' && <EthIcon className="size-10" />}
              </div>
              <div className="grow text-right">
                <div>
                  <div className="text-xl">{balance10pow10}&nbsp;{data.code.toUpperCase()}</div>
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