'use client';

import {prettyDate} from "@/libs/dates";
import {Invoice} from "@prisma/client";
import {Button, Table, Text} from "@radix-ui/themes";
import {ClockIcon, Pen, ShareIcon, MoreVertical} from "lucide-react";
import Link from "next/link";
import React from "react";
import ManuallyApproveInvoiceButton from "./ManuallyApproveInvoiceButton";
import {InvoiceWithPaymentStatus} from "./DashboardInvoices";
import {PaymentStatusBadge} from "./PaymentStatusBadge";

interface InvoiceWithExtras extends Invoice {
  receivedAmount10pow10: number | null;
  paymentPercentage: number | null;
}

export default function InvoicesTable({invoices}:{invoices: InvoiceWithExtras[]}) {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Name / Payer</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Payment Status</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Created / Paid</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {invoices.map(invoice => (
              <Table.Row key={invoice.id}>
                <Table.Cell>
                  {invoice.title}<br />
                  {invoice.payerEmail}
                </Table.Cell>
                <Table.Cell>
                  {!!invoice.coinAmount10pow10 && invoice.coinAmount10pow10/10**10} {(invoice.coinCode||'').toUpperCase()}<br />
                  {invoice.usdAmountCents/100} USD
                </Table.Cell>
                <Table.Cell>
                  <Link href={`/invoices/${invoice.id}`} className="hover:opacity-80 transition-opacity block">
                    <PaymentStatusBadge
                      paidAt={invoice.paidAt}
                      manuallyApprovedAt={invoice.manuallyApprovedAt}
                      receivedAmount10pow10={invoice.receivedAmount10pow10}
                      paymentPercentage={invoice.paymentPercentage}
                      coinCode={invoice.coinCode}
                    />
                  </Link>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-1 items-center text-gray-600">
                    <ClockIcon className="w-4 h-4" />
                    {prettyDate(invoice.createdAt)}
                  </div>
                  {invoice.paidAt && (
                    <Text color="green" className="text-sm">
                      Paid: {prettyDate(invoice.paidAt)}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex gap-1">
                    {!invoice.paidAt && (
                      <ManuallyApproveInvoiceButton
                        invoiceId={invoice.id}
                        invoiceTitle={invoice.title}
                      />
                    )}
                    <Link href={'/invoices/edit/'+invoice.id}>
                      <Button variant="surface" size="1">
                        <Pen className="h-4" />Edit
                      </Button>
                    </Link>
                    <Link href={'/invoice/'+invoice.id}>
                      <Button variant="surface" size="1">
                        <ShareIcon className="h-4" />Pay
                      </Button>
                    </Link>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
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
                <span className="font-medium">
                  {!!invoice.coinAmount10pow10 && invoice.coinAmount10pow10/10**10} {(invoice.coinCode||'').toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">USD:</span>{' '}
                <span className="font-medium">{invoice.usdAmountCents/100} USD</span>
              </div>
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

            {!invoice.paidAt && (
              <div className="mt-3 pt-3 border-t flex gap-2" onClick={(e) => e.preventDefault()}>
                <ManuallyApproveInvoiceButton
                  invoiceId={invoice.id}
                  invoiceTitle={invoice.title}
                />
                <Link href={'/invoices/edit/'+invoice.id} className="flex-1">
                  <Button variant="surface" size="1" className="w-full">
                    <Pen className="h-4" />Edit
                  </Button>
                </Link>
                <Link href={'/invoice/'+invoice.id} className="flex-1">
                  <Button variant="surface" size="1" className="w-full">
                    <ShareIcon className="h-4" />Pay
                  </Button>
                </Link>
              </div>
            )}
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
