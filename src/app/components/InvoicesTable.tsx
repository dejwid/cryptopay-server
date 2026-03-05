'use client';

import {prettyDate} from "@/libs/dates";
import {Invoice} from "@prisma/client";
import {Table, Text} from "@radix-ui/themes";
import {ClockIcon} from "lucide-react";
import Link from "next/link";
import React from "react";
import {PaymentStatusBadge} from "./PaymentStatusBadge";

interface InvoiceWithExtras extends Invoice {
  receivedAmount10pow10: number | null;
  paymentPercentage: number | null;
}

export default function InvoicesTable({invoices}:{invoices: InvoiceWithExtras[]}) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Title</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {invoices.map(invoice => (
              <Table.Row key={invoice.id}>
                <Table.Cell>
                  <Link href={`/invoices/${invoice.id}`} className="text-blue-600 hover:underline font-medium">
                    {invoice.title}
                  </Link>
                  <div className="text-xs text-gray-500">{invoice.payerEmail}</div>
                </Table.Cell>
                <Table.Cell>
                  <div className="font-medium">{invoice.usdAmountCents/100} USD</div>
                  {invoice.coinAmount10pow10 && (
                    <div className="text-xs text-gray-500">
                      {invoice.coinAmount10pow10/10**10} {(invoice.coinCode||'').toUpperCase()}
                    </div>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <PaymentStatusBadge
                    paidAt={invoice.paidAt}
                    manuallyApprovedAt={invoice.manuallyApprovedAt}
                    receivedAmount10pow10={invoice.receivedAmount10pow10}
                    paymentPercentage={invoice.paymentPercentage}
                    coinCode={invoice.coinCode}
                  />
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-1 items-center text-gray-600">
                    <ClockIcon className="w-4 h-4" />
                    {prettyDate(invoice.createdAt)}
                  </div>
                  {invoice.paidAt && (
                    <Text color="green" className="text-xs">
                      Paid: {prettyDate(invoice.paidAt)}
                    </Text>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {invoices.map(invoice => (
          <Link 
            key={invoice.id} 
            href={`/invoices/${invoice.id}`}
            className="block bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-lg truncate dark:text-white">{invoice.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm truncate">{invoice.payerEmail}</p>
              </div>
              <div className="ml-2">
                <PaymentStatusBadge
                  paidAt={invoice.paidAt}
                  manuallyApprovedAt={invoice.manuallyApprovedAt}
                  receivedAmount10pow10={invoice.receivedAmount10pow10}
                  paymentPercentage={invoice.paymentPercentage}
                  coinCode={invoice.coinCode}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm mb-3">
              <div>
                <span className="text-gray-500">Amount:</span>{' '}
                <span className="font-medium">{invoice.usdAmountCents/100} USD</span>
              </div>
              {invoice.coinAmount10pow10 && (
                <div>
                  <span className="text-gray-500">Crypto:</span>{' '}
                  <span className="font-medium">
                    {invoice.coinAmount10pow10/10**10} {(invoice.coinCode||'').toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {prettyDate(invoice.createdAt)}
              </div>
              {invoice.paidAt && (
                <Text color="green" size="2">
                  Paid: {prettyDate(invoice.paidAt)}
                </Text>
              )}
            </div>
          </Link>
        ))}
        {invoices.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No invoices found
          </div>
        )}
      </div>
    </>
  );
}
