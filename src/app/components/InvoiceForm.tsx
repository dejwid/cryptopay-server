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
        className="flex flex-col gap-3">
        {invoice && (
          <input type="hidden" name="invoiceId" value={invoice.id} />
        )}
        <div>
          <label className="block mb-1 text-sm font-medium">Name:</label>
          <TextField.Root
            defaultValue={invoice?.title || ''}
            name="name"
            autoComplete="off"
            required
            className="w-full"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Amount (USD):</label>
          <TextField.Root
            name="amount"
            type="number"
            defaultValue={invoice ? invoice.usdAmountCents / 100 : ''}
            required
            className="w-full"
          />
        </div>
        {!invoice?.productId && (
          <>
            <label className="flex gap-2 my-2 items-center py-2">
              <Switch
                defaultChecked={invoice?.editableCoinCode ?? true}
                onCheckedChange={setEditableCoin}
                name="editableCoinCode"
                value="y"
                size="3"/>
              <span className="text-sm">Payer can choose cryptocurrency</span>
            </label>
            <div className="mb-2">
              <div className="block mb-2 text-sm font-medium">
                {editableCoin ? 'Allowed coins:' : 'Payment coin:'}
              </div>
              <CryptoCards
                multiple={editableCoin}
                name={editableCoin ? 'allowedCoins' : 'coinCode'}
                allowedCoins={['btc', 'bch', 'ltc', 'eth']}
                defaultValue={editableCoin ? (invoice?.allowedCoins||[]) : 'btc'}
              />
            </div>
          </>
        )}
        <SubmitButton className="w-full sm:w-auto mt-2">Save</SubmitButton>
      </form>
    </>
  );
}
