import {userEmailOrThrow} from "@/app/actions/actions";
import InvoicesTable from "@/app/components/InvoicesTable";
import {prisma} from "@/libs/db";
import {Tabs} from "@radix-ui/themes";
import {sum} from "lodash";
import React from "react";

export default async function DashboardInvoices() {
  const email = await userEmailOrThrow();
  const invoices = await prisma.invoice.findMany({where:{payeeEmail:email},orderBy:{createdAt:'desc'}});
  const paid = invoices.filter(i => !!i.paidAt);
  return (
    <>
      <Tabs.Root defaultValue="all">
        <Tabs.List>
          <Tabs.Trigger value="all">All ({invoices.length})</Tabs.Trigger>
          <Tabs.Trigger value="paid">Paid ({paid.length}, {sum(paid.map(i => i.usdAmountCents / 100))}usd)</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="all">
          <InvoicesTable invoices={invoices} />
        </Tabs.Content>
        <Tabs.Content value="paid">
          <InvoicesTable invoices={paid} />
        </Tabs.Content>
      </Tabs.Root>

    </>
  );
}