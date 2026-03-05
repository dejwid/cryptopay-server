import AddressesTable from "@/app/components/AddressesTable";
import {auth} from "@/auth";
import {getCryptoPrices} from "@/libs/cryptoPrices";
import {Button, Heading, Text, Tabs, ScrollArea} from "@radix-ui/themes";
import {uniq} from "lodash";
import {PlusIcon} from "lucide-react";
import Link from "next/link";
import {prisma} from "@/libs/db";

export default async function AddressesPage() {
  const session = await auth();
  const addresses = await prisma.address.findMany({where:{userEmail:session?.user?.email || ''},orderBy:{createdAt:'desc'}});
  const addressesCoinTypes = uniq(addresses.map(a => a.code));
  const cryptoPrices = await getCryptoPrices();
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading size="5">Wallets</Heading>
          <Text size="2" color="gray">Your wallet addresses</Text>
        </div>
        <Link href="/addresses/new">
          <Button size="2">
            <PlusIcon className="h-4 w-4" />
            Add
          </Button>
        </Link>
      </div>
      
      <Tabs.Root defaultValue="all">
        <ScrollArea>
          <Tabs.List style={{ minWidth: 'max-content' }}>
            <Tabs.Trigger value="all">All ({addresses.length})</Tabs.Trigger>
            {addressesCoinTypes.map(coin => (
              <Tabs.Trigger value={coin} key={coin}>
                {coin.toUpperCase()} ({addresses.filter(a => a.code === coin).length})
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </ScrollArea>
        <Tabs.Content value="all">
          <AddressesTable addresses={addresses} cryptoPrices={cryptoPrices} />
        </Tabs.Content>
        {addressesCoinTypes.map(coin => (
          <Tabs.Content value={coin} key={coin}>
            <AddressesTable addresses={addresses.filter(a => a.code === coin)} cryptoPrices={cryptoPrices} />
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
}
