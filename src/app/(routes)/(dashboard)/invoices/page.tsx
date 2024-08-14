import {userEmailOrThrow} from "@/app/actions/actions";
import {auth} from "@/auth";
import {prettyDate} from "@/libs/dates";
import {prisma} from "@/libs/db";
import {Button, Heading, Table, Text} from "@radix-ui/themes";
import {BadgeAlert, BadgeCheck, CheckCircleIcon, ClockIcon, Pen, PlusIcon, ShareIcon} from "lucide-react";
import Link from "next/link";
import React from "react";

export default async function InvoicesPage() {
  const email = await userEmailOrThrow();
  const invoices = await prisma.invoice.findMany({where:{payeeEmail:email},orderBy:{createdAt:'desc'}});
  return (
    <div>
        <Heading className="mb-4 flex gap-4">
          Invoices
          <Link href="/invoices/new">
            <Button variant="outline">
              <PlusIcon className="h-4 w-4" />
              Create new
            </Button>
          </Link>
        </Heading>
      <Table.Root>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Name / Payer</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
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
                <div className="flex gap-1 items-center text-gray-600">
                  <ClockIcon className="w-5 h-5" />
                  {prettyDate(invoice.createdAt)}
                </div>
                {invoice.paidAt ? (
                  <Text color="green" className="font-bold flex gap-1 items-center">
                    <BadgeCheck className="w-5 h-5" />
                    {prettyDate(invoice.paidAt)}
                  </Text>
                ) : (
                  <Text color="red" className="flex gap-1 items-center">
                    <BadgeAlert className="w-5 h-5" />
                    not paid yet
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <div className="flex gap-1">
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
    </div>
  );
}