'use client';
import {createProductInvoice} from "@/app/actions/actions";
import CryptoCards from "@/app/components/CryptoCards";
import {BchIcon, BtcIcon, EthIcon, LtcIcon} from "@/app/components/CryptoIcons";
import SubmitButton from "@/app/components/SubmitButton";
import {CoinCode, CryptoPrices} from "@/libs/cryptoPrices";
import {usdToCoinClient} from "@/libs/crypto-client";
import {Product} from "@prisma/client";
import {RadioCards, TextField} from "@radix-ui/themes";
import {ArrowRight, BitcoinIcon} from "lucide-react";
import {useRouter} from "next/navigation";

export default function BuyForm({
  product,
  cryptoPrices,
  availableCoins,
}:{
  product:Product;
  cryptoPrices:CryptoPrices;
  availableCoins:CoinCode[];
}) {
  const router = useRouter();

  if (!product.usdCents) {
    return 'no price';
  }
  return (
    <>
      <form action={async (data:FormData) => {
        const invoice = await createProductInvoice(data);
        router.push('/invoice/'+invoice.id);
      }}>
        <input type="hidden" name="productId" value={product.id} />
        <CryptoCards
          allowedCoins={availableCoins}
          cryptoPrices={cryptoPrices}
          usdCents={product.usdCents || 0}
          defaultValue={availableCoins?.[0]}
        />
        <div className="text-left my-4">
          Your email {product && `(to receive the product)`}
          <TextField.Root required size="3" name="email" type="email" placeholder="your.email@example.com" />
        </div>
        <div className="flex flex-col justify-center">
          <div className="w-full"></div>
          <SubmitButton size="4">
            Proceed <ArrowRight />
          </SubmitButton>
        </div>
      </form>
    </>
  );
}