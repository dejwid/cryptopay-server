import {prettyDate} from "@/libs/dates";
import {Invoice} from "@prisma/client";
import {Button, Table, Text} from "@radix-ui/themes";
import {BadgeAlert, BadgeCheck, ClockIcon, Pen, ShareIcon, AlertTriangleIcon} from "lucide-react";
import Link from "next/link";
import React from "react";
import ManuallyApproveInvoiceButton from "./ManuallyApproveInvoiceButton";
import {InvoiceWithPaymentStatus} from "./DashboardInvoices";
import {maxPaymentShortfall} from "@/libs/config";

interface InvoiceWithExtras extends Invoice {
  receivedAmount10pow10: number | null;
  paymentPercentage: number | null;
}

// Calculate thresholds: 90-110% is acceptable (using maxPaymentShortfall = 0.1)
const minAcceptablePercentage = (1 - maxPaymentShortfall) * 100; // 90%
const maxAcceptablePercentage = (1 + maxPaymentShortfall) * 100; // 110%

export default function InvoicesTable({invoices}:{invoices: InvoiceWithExtras[]}) {
  return (
    <>
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
                  {invoice.paidAt ? (
                    <Text color="green" className="flex gap-1 items-center">
                      <BadgeCheck className="w-5 h-5" />
                      Paid
                      {invoice.manuallyApprovedAt && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded ml-1">manual</span>
                      )}
                    </Text>
                  ) : invoice.receivedAmount10pow10 !== null && invoice.receivedAmount10pow10 > 0 ? (
                    <div className="flex flex-col gap-1">
                      {invoice.paymentPercentage! > maxAcceptablePercentage ? (
                        <Text className="flex gap-1 items-center text-purple-600">
                          <BadgeCheck className="w-5 h-5" />
                          Overpaid
                        </Text>
                      ) : invoice.paymentPercentage! >= minAcceptablePercentage ? (
                        <Text color="green" className="flex gap-1 items-center">
                          <BadgeCheck className="w-5 h-5" />
                          Acceptable
                        </Text>
                      ) : (
                        <Text color="red" className="flex gap-1 items-center">
                          <AlertTriangleIcon className="w-5 h-5" />
                          Underpaid
                        </Text>
                      )}
                      <Text size="1" className="text-gray-600">
                        Received: {(invoice.receivedAmount10pow10 / 10**10).toFixed(8)} {invoice.coinCode?.toUpperCase()}
                      </Text>
                      <Text size="1" className={
                        invoice.paymentPercentage! > maxAcceptablePercentage 
                          ? "text-purple-600 font-bold" 
                          : invoice.paymentPercentage! < minAcceptablePercentage 
                            ? "text-red-600 font-bold" 
                            : "text-green-600"
                      }>
                        {invoice.paymentPercentage!.toFixed(1)}% of expected
                      </Text>
                    </div>
                  ) : (
                    <Text color="red" className="flex gap-1 items-center">
                      <BadgeAlert className="w-5 h-5" />
                      No payment detected
                    </Text>
                  )}
                </Link>
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-1 items-center text-gray-600">
                  <ClockIcon className="w-5 h-5" />
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
                    <Button variant="surface">
                      <Pen className="h-4" />Edit
                    </Button>
                  </Link>
                  <Link href={'/invoice/'+invoice.id}>
                    <Button variant="surface">
                      <ShareIcon className="h-4" />Pay&nbsp;link
                    </Button>
                  </Link>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </>
  );
}
