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
      <Heading className="mb-4 flex gap-4">
        Products
        <Link href="/products/new">
          <Button variant="outline">
            <PlusIcon className="h-4 w-4" />
            Add product
          </Button>
        </Link>
      </Heading>
      <Suspense fallback="Loading...">
        <DashboardProducts />
      </Suspense>
    </div>
  );
}