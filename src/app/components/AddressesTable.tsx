import BalanceRefresh from "@/app/components/BalanceRefresh";
import type {CoinCode, CryptoPrices} from "@/libs/cryptoPrices";
import {prettyDate} from "@/libs/dates";
import {Address} from "@prisma/client";
import {IconButton, Table} from "@radix-ui/themes";

export default function AddressesTable({addresses,cryptoPrices}:{addresses:Address[],cryptoPrices:CryptoPrices}) {
  return (
    <>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>address</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Balance</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Busy</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Added</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {addresses.map((address) => {
            const cryptoAmount = (address.lastBalance10pow10||0) / 10**10;
            const usdAmount = cryptoAmount === 0 ? 0 : cryptoAmount * cryptoPrices?.[address.code as CoinCode];
            return (
              <Table.Row key={address.id}>
                <Table.Cell>
                  {address.address}
                  &nbsp;{address.privateKey}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-2 items-center">
                    <div>
                      {cryptoAmount}&nbsp;{address.code.toUpperCase()}<br />
                      {usdAmount === 0 ? 0 : '~'+usdAmount.toFixed(4)}&nbsp;USD
                      <div className="text-xs text-gray-600">
                        {address.balanceUpdatedAt ? prettyDate(address.balanceUpdatedAt) : ''}
                      </div>
                    </div>
                    <div>
                      <BalanceRefresh addressId={address.id} />
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>{address.busyTo ? prettyDate(address.busyTo) : '-'}</Table.Cell>
                <Table.Cell>{prettyDate(address?.createdAt)}</Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </>
  );
}