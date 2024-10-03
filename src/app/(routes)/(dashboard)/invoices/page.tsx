import DashboardInvoices from "@/app/components/DashboardInvoices";
import {Button, Heading} from "@radix-ui/themes";
import {PlusIcon} from "lucide-react";
import Link from "next/link";
import React, {Suspense} from "react";

export default async function InvoicesPage() {

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
        <Suspense fallback="Loading...">
          <DashboardInvoices />
        </Suspense>
    </div>
  );
}