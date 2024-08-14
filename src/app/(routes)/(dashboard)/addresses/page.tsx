import AddressesTable from "@/app/components/AddressesTable";
import AddressForm from "@/app/components/AddressForm";
import {auth} from "@/auth";
import {getCryptoPrices} from "@/libs/cryptoPrices";
import {prettyDate} from "@/libs/dates";
import {PrismaClient} from "@prisma/client";
import {Button, Card, Heading, Table, Tabs, Text} from "@radix-ui/themes";
import {uniq} from "lodash";
import {PlusIcon} from "lucide-react";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function AddressesPage() {
  const session = await auth();
  const addresses = await prisma.address.findMany({where:{userEmail:session?.user?.email || ''},orderBy:{createdAt:'desc'}});
  const addressesCoinTypes = uniq(addresses.map(a => a.code));
  const cryptoPrices = await getCryptoPrices();
  return (
    <div>
      {session && (
        <div>
          <Heading className="mb-4 flex gap-4">
            Your wallets
            <Link href="/addresses/new">
              <Button variant="outline">
                <PlusIcon className="h-4 w-4" />
                Add addresses
              </Button>
            </Link>
          </Heading>
          <Tabs.Root defaultValue="all">
            <Tabs.List>
              <Tabs.Trigger value="all">All ({addresses.length})</Tabs.Trigger>
              {addressesCoinTypes.map(coin => (
                <Tabs.Trigger value={coin} key={coin}>
                  {coin.toUpperCase()} ({addresses.filter(a => a.code === coin).length})
                </Tabs.Trigger>
              ))}
            </Tabs.List>
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
      )}
    </div>
  );
}