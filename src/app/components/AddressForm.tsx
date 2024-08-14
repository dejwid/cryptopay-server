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
      <div className="flex flex-col gap-2">
        <TextArea name="addresses" required placeholder="Wallet addresses (one per line)"/>
        <div className="">
          <CryptoCards defaultValue={'btc'} allowedCoins={['btc','bch','eth','ltc']} desktopCols={4} />
        </div>
        <div>
          <Button>Add</Button>
        </div>
      </div>
    </form>
  );
}