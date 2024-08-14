import {getAddressForInvoice} from "@/app/actions/actions";
import AwaitingPayment from "@/app/components/AwaitingPayment";
import CopyButton from "@/app/components/CopyButton";
import {paymentUri} from "@/libs/crypto-client";
import {CoinCode} from "@/libs/cryptoPrices";
import {Invoice} from "@prisma/client";
import {Heading} from "@radix-ui/themes";
import QRCode from "react-qr-code";

export default async function PayInvoice({
  invoice,
  chosenCoin,
}:{
  invoice:Invoice,
  chosenCoin:CoinCode,
}) {
  const address = await getAddressForInvoice(invoice.id);
  if (!address) {
    return 'No available addresses';
  }
  if (!invoice.coinAmount10pow10) {
    return (
      <div>
        <pre>{JSON.stringify(invoice, null, 2)}</pre>
      </div>
    );
  }
  return (
    <>
      <div className="pay-outer">
        <Heading size="5" className="mt-4 mb-2 text-gray-500">{invoice.title}</Heading>
        <Heading size="8" className="flex justify-center items-center gap-2">
          {invoice.coinAmount10pow10 / 10 ** 10} {chosenCoin.toUpperCase()}
          <CopyButton size="lg" text={(invoice.coinAmount10pow10 / 10 ** 10).toString()}/>
        </Heading>
        <Heading size="4" className="mb-4 text-gray-400">
          ~ ${invoice.usdAmountCents / 100} USD
        </Heading>
        <div className="mb-2 inline-block text-left">
          <div className="uppercase text-gray-400 text-sm font-bold text-center">address</div>
          <div className="w-64 flex gap-1 items-center">
            <div className="text-left shrink w-56 leading-5">
              {address.address}
            </div>
            <CopyButton size="md" text={address.address}/>
          </div>
        </div>
        {!invoice.paidAt && address.busyTo && (
          <div className="w-64 mt-2 mb-4 mx-auto">
            <AwaitingPayment
              isProduct={!!invoice.productId}
              invoiceId={invoice.id}
              busyTo={address.busyTo}/>
          </div>
        )}
        <div className="mb-4 w-48 mx-auto">
          <QRCode size={128 * 1.5}
                  value={paymentUri(invoice.coinCode as CoinCode, address.address, invoice.coinAmount10pow10 / 10 ** 10)}/>
        </div>
      </div>
    </>
  );
}