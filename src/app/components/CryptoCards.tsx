import {BchIcon, BtcIcon, EthIcon, LtcIcon} from "@/app/components/CryptoIcons";
import {usdToCoinClient} from "@/libs/crypto-client";
import {CoinCode, CryptoPrices} from "@/libs/cryptoPrices";
import {CheckboxCards, RadioCards} from "@radix-ui/themes";
import {ReactNode} from "react";

function CardContent({label,cryptoPrice,icon,symbol}:{label:string,cryptoPrice?:string|number;symbol:string;icon:ReactNode}) {
  return (
    <div className="w-full flex gap-2 items-center">
      <div className="group-disabled:opacity-50">
        {icon}
      </div>
      <div>
        {label}
        {cryptoPrice && (
          <>
            <br/>
            <span className="text-xs">
              {cryptoPrice} {symbol.toUpperCase()}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function CryptoCards({
  allowedCoins = ['btc', 'bch', 'ltc', 'eth'],
  defaultValue,
  cryptoPrices,
  usdCents,
  name = 'coin',
  desktopCols = 2,
  multiple = false,
}: {
  allowedCoins: CoinCode[];
  defaultCoin?: CoinCode;
  cryptoPrices?: CryptoPrices;
  usdCents?: number;
  name?: string;
  desktopCols?: number;
  multiple?: boolean;
  defaultValue: string | string[];
}) {
  const prices = [
    {
      symbol: 'btc',
      label: 'Bitcoin',
      Icon: () => <BtcIcon/>
    },
    {
      symbol: 'bch',
      label: 'Bitcoin Cash',
      Icon: () => <BchIcon/>
    },
    {
      symbol: 'ltc',
      label: 'Litecoin',
      Icon: () => <LtcIcon />
    },
    {
      symbol: 'eth',
      label: 'Ethereum',
      Icon: () => <EthIcon />
    },
  ];

  const CardsElem = multiple ? CheckboxCards : RadioCards;

  const columns = {initial:"2",md:desktopCols.toString()};

  const Wrapper = ({children}:{children:ReactNode}) => {
    if (multiple && Array.isArray(defaultValue)) {
      return (
        <CheckboxCards.Root defaultValue={defaultValue} columns={columns} name={name}>
          {children}
        </CheckboxCards.Root>
      );
    }
    if (!multiple && typeof defaultValue === 'string') {
      return (
        <RadioCards.Root defaultValue={defaultValue} columns={columns} name={name} required>
          {children}
        </RadioCards.Root>
      );
    }
  };

  return (
    <div>
      <Wrapper>
        {prices.filter(p => allowedCoins.includes(p.symbol as CoinCode)).map(({symbol, label, Icon}) => (
          <CardsElem.Item
            value={symbol}
            key={symbol}
            className="group"
            disabled={!allowedCoins.includes(symbol as CoinCode)}
          >
            <CardContent
              label={label}
              symbol={symbol}
              cryptoPrice={
                usdCents && cryptoPrices
                  ? usdToCoinClient((usdCents || 0) / 100 || 0, cryptoPrices?.[symbol as CoinCode])
                  : undefined
              }
              icon={<Icon />}
            />
          </CardsElem.Item>
        ))}
      </Wrapper>
    </div>
  );
}