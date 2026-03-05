import BalanceRefresh from "@/app/components/BalanceRefresh";
import type {CoinCode, CryptoPrices} from "@/libs/cryptoPrices";
import {prettyDate} from "@/libs/dates";
import {Address} from "@prisma/client";
import {IconButton, Table} from "@radix-ui/themes";

export default function AddressesTable({addresses,cryptoPrices}:{addresses:Address[],cryptoPrices:CryptoPrices}) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Address</Table.ColumnHeaderCell>
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
                    <div className="max-w-xs truncate" title={address.address}>
                      {address.address}
                    </div>
                    <div className="text-xs text-gray-500">{address.privateKey}</div>
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
                        <BalanceRefresh
                          addressId={address.id}
                          address={address.address}
                          code={address.code}
                        />
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
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {addresses.map((address) => {
          const cryptoAmount = (address.lastBalance10pow10||0) / 10**10;
          const usdAmount = cryptoAmount === 0 ? 0 : cryptoAmount * cryptoPrices?.[address.code as CoinCode];
          return (
            <div key={address.id} className="bg-gray-50 border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium mb-2">
                    {address.code.toUpperCase()}
                  </div>
                  <div className="font-mono text-sm break-all">
                    {address.address}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="font-semibold">
                    {cryptoAmount} {address.code.toUpperCase()}
                  </div>
                  <div className="text-gray-600">
                    {usdAmount === 0 ? 0 : '~'+usdAmount.toFixed(4)} USD
                  </div>
                </div>
                <BalanceRefresh
                  addressId={address.id}
                  address={address.address}
                  code={address.code}
                />
              </div>

              <div className="flex justify-between text-sm text-gray-500 pt-3 border-t">
                <div>
                  <span className="text-gray-400">Busy: </span>
                  {address.busyTo ? prettyDate(address.busyTo) : '-'}
                </div>
                <div>
                  <span className="text-gray-400">Added: </span>
                  {prettyDate(address?.createdAt)}
                </div>
              </div>

              {address.balanceUpdatedAt && (
                <div className="text-xs text-gray-400 mt-2">
                  Balance updated: {prettyDate(address.balanceUpdatedAt)}
                </div>
              )}
            </div>
          );
        })}
        {addresses.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No addresses found
          </div>
        )}
      </div>
    </>
  );
}
