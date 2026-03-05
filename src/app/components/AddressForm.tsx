'use client';
import {addWalletAddressesAction} from "@/app/actions/actions";
import CryptoCards from "@/app/components/CryptoCards";
import {Button, TextArea} from "@radix-ui/themes";
import {useRouter} from "next/navigation";

export default function AddressForm() {
  const router = useRouter();
  return (
    <form action={async data => {
      await addWalletAddressesAction(data);
      router.refresh();
      router.push('/addresses');
    }}>
      <div className="flex flex-col gap-3">
        <div>
          <label className="block mb-1 text-sm font-medium">Wallet addresses:</label>
          <TextArea 
            name="addresses" 
            required 
            placeholder="Wallet addresses (one per line)"
            className="w-full min-h-[150px]"
          />
        </div>
        <div>
          <label className="block mb-2 text-sm font-medium">Select cryptocurrency:</label>
          <CryptoCards name="code" defaultValue={'btc'} allowedCoins={['btc','bch','eth','ltc']} desktopCols={2} />
        </div>
        <div>
          <Button className="w-full sm:w-auto">Add</Button>
        </div>
      </div>
    </form>
  );
}
