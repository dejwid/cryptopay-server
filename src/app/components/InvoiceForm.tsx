'use client';
import {saveInvoice} from "@/app/actions/invoiceActions";
import CryptoCards from "@/app/components/CryptoCards";
import SubmitButton from "@/app/components/SubmitButton";
import {Invoice} from "@prisma/client";
import {Heading, Switch, TextField} from "@radix-ui/themes";
import {useRouter} from "next/navigation";
import {useState} from "react";

export default function InvoiceForm({invoice}:{invoice?:Invoice}) {
  const [editableCoin, setEditableCoin] = useState(invoice?.editableCoinCode ?? true);
  const router = useRouter();
  if (invoice?.paidAt) {
    return 'Cant edit paid invoice';
  }
  return (
    <>
      <form
        action={async(data:FormData) => {
          await saveInvoice(data);
          router.push('/invoices');
          router.refresh();
        }}
        className="flex flex-col gap-2">
        {invoice && (
          <input type="hidden" name="invoiceId" value={invoice.id} />
        )}
        <div>
        Name:
          <TextField.Root
            defaultValue={invoice?.title || ''}
            name="name"
            autoComplete="off"
            required />
        </div>
        <div>
          Amount (USD):
          <TextField.Root
            name="amount"
            type="number"
            defaultValue={invoice ? invoice.usdAmountCents / 100 : ''}
            required />
        </div>
        {!invoice?.productId && (
          <>
            <label className="flex gap-2 my-2 items-center">
              <Switch
                defaultChecked={invoice?.editableCoinCode ?? true}
                onCheckedChange={setEditableCoin}
                name="editableCoinCode"
                value="y"
                size="3"/>
              <span>Payer can choose cryptocurrency</span>
            </label>
            <div className="mb-2">
              <div className="mb-2">{editableCoin ? 'Allowed coins' : 'Payment coin'}:</div>
              <CryptoCards
                multiple={editableCoin}
                name={editableCoin ? 'allowedCoins' : 'coinCode'}
                allowedCoins={['btc', 'bch', 'ltc', 'eth']}
                defaultValue={editableCoin ? (invoice?.allowedCoins||[]) : 'btc'}
              />
            </div>
          </>
        )}
        <SubmitButton>Save</SubmitButton>
      </form>
    </>
  );
}