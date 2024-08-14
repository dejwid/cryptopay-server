import PayInvoice from "@/app/(routes)/(front)/(payment)/invoice/[invoiceId]/PayInvoice";
import {getAddressForInvoice} from "@/app/actions/actions";
import AwaitingPayment from "@/app/components/AwaitingPayment";
import CopyButton from "@/app/components/CopyButton";
import CryptoCards from "@/app/components/CryptoCards";
import InvoiceCoinForm from "@/app/components/InvoiceCoinForm";
import ShortAddress from "@/app/components/ShortAddress";
import {supportedCoins} from "@/libs/config";
import {CoinCode, getCryptoPrices} from "@/libs/cryptoPrices";
import {paymentUri} from "@/libs/crypto-client";
import {prisma} from "@/libs/db";
import {Heading, IconButton, Spinner, Text} from "@radix-ui/themes";
import QRCode from 'react-qr-code'

export default async function InvoicePage({
  params:{invoiceId},
  searchParams:{coin:coinParam},
}:{
  params:{invoiceId:string};
  searchParams:{coin:string;};
}) {
  const invoice = await prisma.invoice.findFirst({where:{id:invoiceId}});
  if (!invoice) {
    return '404 invoice not found';
  }
  if (invoice.paidAt) {
    return (
      <div>
        <Heading size="5" className="mt-4 mb-2 text-gray-500">{invoice.title}</Heading>
        <Heading size="8" className="mb-2">Thank you!</Heading>
        <div className="my-4">
          <Text>The invoice has been paid.</Text><br />
          {invoice.productId && (
            <Text>Check your email for the product link</Text>
          )}
        </div>
      </div>
    );
  }
  const chosenCoin = (invoice.editableCoinCode ? coinParam : invoice.coinCode);
  const cryptoPrices = await getCryptoPrices();
  return (
    <div>
      {chosenCoin && supportedCoins.includes(chosenCoin) ? (
        <PayInvoice invoice={invoice} chosenCoin={chosenCoin as CoinCode} />
      ) : (
        <div>
          <Heading size="5" className="mt-4 mb-2 text-gray-500">{invoice.title}</Heading>
          <Heading size="8" className="mb-4">
            ${invoice.usdAmountCents / 100} USD
          </Heading>
          <div className="mb-4">Select cryptocurrency you want to pay with</div>
          <InvoiceCoinForm invoice={invoice} cryptoPrices={cryptoPrices} />
        </div>
      )}

    </div>
  );
}