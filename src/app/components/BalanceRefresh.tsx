'use client';

import BalanceRefreshModal from "@/app/components/BalanceRefreshModal";
import {IconButton} from "@radix-ui/themes";
import {RefreshCw} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";

type BalanceRefreshProps = {
  addressId: string;
  address?: string;
  code?: string;
};

export default function BalanceRefresh({ addressId, address, code }: BalanceRefreshProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  const handleComplete = () => {
    router.refresh();
  };

  return (
    <>
      <IconButton 
        variant="ghost" 
        onClick={() => setModalOpen(true)}
        title="Refresh balance with debug info"
      >
        <RefreshCw className="h-4"/>
      </IconButton>

      <BalanceRefreshModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        addressId={addressId}
        addressInfo={address && code ? { address, code } : undefined}
        onComplete={handleComplete}
      />
    </>
  );
}
