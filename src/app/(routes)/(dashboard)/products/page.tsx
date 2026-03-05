import DashboardProducts from "@/app/components/DashboardProducts";
import {Button, Heading, Text} from "@radix-ui/themes";
import {PlusIcon} from "lucide-react";
import Link from "next/link";
import {Suspense} from "react";

export default async function ProductsPage() {

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading size="5">Products</Heading>
          <Text size="2" color="gray">Your digital products</Text>
        </div>
        <Link href="/products/new">
          <Button size="2">
            <PlusIcon className="h-4 w-4" />
            Add
          </Button>
        </Link>
      </div>
      <Suspense fallback="Loading...">
        <DashboardProducts />
      </Suspense>
    </div>
  );
}
