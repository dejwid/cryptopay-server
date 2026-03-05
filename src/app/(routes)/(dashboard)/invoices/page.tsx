import DashboardInvoices from "@/app/components/DashboardInvoices";
import {Button, Heading, Text} from "@radix-ui/themes";
import {PlusIcon} from "lucide-react";
import Link from "next/link";
import React, {Suspense} from "react";

export default async function InvoicesPage() {

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading size="5">Invoices</Heading>
          <Text size="2" color="gray">Payment requests</Text>
        </div>
        <Link href="/invoices/new">
          <Button size="2">
            <PlusIcon className="h-4 w-4" />
            New
          </Button>
        </Link>
      </div>
      <Suspense fallback="Loading...">
        <DashboardInvoices />
      </Suspense>
    </div>
  );
}
