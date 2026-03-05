import DashboardInvoices from "@/app/components/DashboardInvoices";
import {Button, Heading} from "@radix-ui/themes";
import {PlusIcon} from "lucide-react";
import Link from "next/link";
import React, {Suspense} from "react";

export default async function InvoicesPage() {

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <Heading>Invoices</Heading>
        <Link href="/invoices/new">
          <Button variant="outline">
            <PlusIcon className="h-4 w-4" />
            Create new
          </Button>
        </Link>
      </div>
      <Suspense fallback="Loading...">
        <DashboardInvoices />
      </Suspense>
    </div>
  );
}
