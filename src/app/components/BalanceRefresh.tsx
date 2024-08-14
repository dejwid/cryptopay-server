'use client';
import {updateAddressBalanceAction} from "@/app/actions/actions";
import {IconButton} from "@radix-ui/themes";
import {RefreshCw} from "lucide-react";
import {useRouter} from "next/navigation";

export default function BalanceRefresh({addressId}:{addressId:string}) {
  const router = useRouter();
  return (
    <>
      <form action={async () => {
        await updateAddressBalanceAction(addressId);
        router.refresh();
      }}>
        <IconButton variant="ghost">
          <RefreshCw className="h-4"/>
        </IconButton>
      </form>
    </>
  );
}