'use client';
import {selectInvoiceCoin} from "@/app/actions/invoiceActions";
import CryptoCards from "@/app/components/CryptoCards";
import SubmitButton from "@/app/components/SubmitButton";
import {CoinCode, CryptoPrices} from "@/libs/cryptoPrices";
import {Invoice} from "@prisma/client";
import {ArrowRight} from "lucide-react";
import {useRouter} from "next/navigation";

export default function InvoiceCoinForm({invoice,cryptoPrices}:{invoice:Invoice,cryptoPrices:CryptoPrices}) {
  const router = useRouter();
  return (
    <>
      <form action={async (data:FormData) => {
        await selectInvoiceCoin(data);
        router.push('?coin='+data.get('coin'));
      }}>
        <input type="hidden" name="invoiceId" value={invoice.id}/>
        <CryptoCards
          cryptoPrices={cryptoPrices}
          usdCents={invoice.usdAmountCents}
          allowedCoins={invoice.allowedCoins as CoinCode[]}
          defaultValue={'btc'}
        />
        <div className="flex flex-col mt-4">
          <div className="w-full"></div>
          <SubmitButton>Proceed <ArrowRight /></SubmitButton>
        </div>
      </form>
    </>
  );
}