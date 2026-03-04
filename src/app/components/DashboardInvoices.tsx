import {userEmailOrThrow} from "@/app/actions/actions";
import InvoicesTable from "@/app/components/InvoicesTable";
import {prisma} from "@/libs/db";
import {Tabs} from "@radix-ui/themes";
import {sum} from "lodash";
import React from "react";

export type InvoiceWithPaymentStatus = Awaited<ReturnType<typeof getInvoicesWithPayments>>[number];

async function getInvoicesWithPayments(email: string) {
  const invoices = await prisma.invoice.findMany({
    where: { payeeEmail: email },
    orderBy: { createdAt: 'desc' },
  });
  
  // For each unpaid invoice, get the assigned address and any balance changes
  const invoicesWithPayments = await Promise.all(
    invoices.map(async (invoice) => {
      if (invoice.paidAt || !invoice.coinAmount10pow10) {
        return { ...invoice, receivedAmount10pow10: null, paymentPercentage: null };
      }
      
      // Find the address assigned to this invoice
      const address = await prisma.address.findFirst({
        where: { invoiceId: invoice.id },
        orderBy: { busyFrom: 'desc' },
      });
      
      // Check for any balance changes on this address during busy period
      let receivedAmount10pow10: number | null = null;
      
      if (address && address.busyFrom) {
        const balanceChanges = await prisma.balanceChange.findMany({
          where: {
            addressId: address.id,
            createdAt: { gte: address.busyFrom },
          },
          orderBy: { createdAt: 'desc' },
        });
        
        // Sum up all balance changes (positive ones are incoming payments)
        const totalChange = balanceChanges.reduce((sum, bc) => sum + bc.balanceChange10pow10, 0);
        if (totalChange > 0) {
          receivedAmount10pow10 = totalChange;
        }
      }
      
      const paymentPercentage = receivedAmount10pow10 && invoice.coinAmount10pow10
        ? (receivedAmount10pow10 / invoice.coinAmount10pow10) * 100
        : null;
      
      return {
        ...invoice,
        receivedAmount10pow10,
        paymentPercentage,
      };
    })
  );
  
  return invoicesWithPayments;
}

export default async function DashboardInvoices() {
  const email = await userEmailOrThrow();
  const invoicesWithPayments = await getInvoicesWithPayments(email);
  
  const paid = invoicesWithPayments.filter(i => !!i.paidAt);
  const unpaidWithPartialPayment = invoicesWithPayments.filter(
    i => !i.paidAt && i.paymentPercentage !== null && i.paymentPercentage > 0
  );
  
  return (
    <>
      <Tabs.Root defaultValue="all">
        <Tabs.List>
          <Tabs.Trigger value="all">All ({invoicesWithPayments.length})</Tabs.Trigger>
          <Tabs.Trigger value="paid">Paid ({paid.length}, {sum(paid.map(i => i.usdAmountCents / 100))}usd)</Tabs.Trigger>
          {unpaidWithPartialPayment.length > 0 && (
            <Tabs.Trigger value="partial">Partial payment ({unpaidWithPartialPayment.length})</Tabs.Trigger>
          )}
        </Tabs.List>
        <Tabs.Content value="all">
          <InvoicesTable invoices={invoicesWithPayments} />
        </Tabs.Content>
        <Tabs.Content value="paid">
          <InvoicesTable invoices={paid} />
        </Tabs.Content>
        {unpaidWithPartialPayment.length > 0 && (
          <Tabs.Content value="partial">
            <InvoicesTable invoices={unpaidWithPartialPayment} />
          </Tabs.Content>
        )}
      </Tabs.Root>
    </>
  );
}
