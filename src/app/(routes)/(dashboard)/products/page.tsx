import ArchiveProductButton from "@/app/components/ArchiveProductButton";
import DashboardProducts from "@/app/components/DashboardProducts";
import ProductsTable from "@/app/components/ProductsTable";
import {auth} from "@/auth";
import {prisma} from "@/libs/db";
import {Button, Heading, IconButton, Table, Tabs} from "@radix-ui/themes";
import {Pen, PenIcon, PlusIcon, ShareIcon} from "lucide-react";
import Link from "next/link";
import {Suspense} from "react";

export default async function ProductsPage() {

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <Heading>Products</Heading>
        <Link href="/products/new">
          <Button variant="outline">
            <PlusIcon className="h-4 w-4" />
            Add product
          </Button>
        </Link>
      </div>
      <Suspense fallback="Loading...">
        <DashboardProducts />
      </Suspense>
    </div>
  );
}
