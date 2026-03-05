'use client';

import type {CoinCode, CryptoPrices} from "@/libs/cryptoPrices";
import {prettyDate} from "@/libs/dates";
import {Address} from "@prisma/client";
import {Badge, Table} from "@radix-ui/themes";
import Link from "next/link";

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
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Added</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {addresses.map((address) => {
              const cryptoAmount = (address.lastBalance10pow10||0) / 10**10;
              const usdAmount = cryptoAmount === 0 ? 0 : cryptoAmount * cryptoPrices?.[address.code as CoinCode];
              const isBusy = address.busyTo && new Date(address.busyTo) > new Date();
              return (
                <Table.Row key={address.id}>
                  <Table.Cell>
                    <Link 
                      href={`/addresses/${address.id}`}
                      className="text-blue-600 hover:underline font-mono text-sm" 
                    >
                      {address.address.slice(0, 8)}...{address.address.slice(-6)}
                    </Link>
                    <Badge size="1" color="blue" className="ml-2">{address.code.toUpperCase()}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="font-medium">{cryptoAmount} {address.code.toUpperCase()}</div>
                    <div className="text-xs text-gray-500">
                      {usdAmount === 0 ? 0 : '~'+usdAmount.toFixed(2)} USD
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {isBusy ? (
                      <Badge color="orange">Busy</Badge>
                    ) : (
                      <Badge color="green">Available</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-gray-500">{prettyDate(address?.createdAt)}</Table.Cell>
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
          const isBusy = address.busyTo && new Date(address.busyTo) > new Date();
          return (
            <Link 
              key={address.id} 
              href={`/addresses/${address.id}`}
              className="block bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge size="1" color="blue">{address.code.toUpperCase()}</Badge>
                    {isBusy ? (
                      <Badge color="orange">Busy</Badge>
                    ) : (
                      <Badge color="green">Available</Badge>
                    )}
                  </div>
                  <div className="font-mono text-sm truncate">
                    {address.address.slice(0, 12)}...{address.address.slice(-8)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {cryptoAmount} {address.code.toUpperCase()}
                  </div>
                  <div className="text-gray-600 text-sm">
                    {usdAmount === 0 ? 0 : '~'+usdAmount.toFixed(2)} USD
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {prettyDate(address?.createdAt)}
                </div>
              </div>
            </Link>
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
