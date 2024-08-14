import {getUserEmail} from "@/app/actions/actions";
import ProductsTable from "@/app/components/ProductsTable";
import {prisma} from "@/libs/db";
import {Tabs} from "@radix-ui/themes";

export default async function DashboardProducts() {
  const products = await prisma.product.findMany({where:{userEmail:await getUserEmail() || ''}});
  return (
    <>
      <Tabs.Root defaultValue="active">
        <Tabs.List>
          <Tabs.Trigger value="active">Active products</Tabs.Trigger>
          <Tabs.Trigger value="archived">Archived</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="active">
          <ProductsTable products={products.filter(p => !p.archivedAt)} />
        </Tabs.Content>
        <Tabs.Content value="archived">
          <ProductsTable products={products.filter(p => p.archivedAt)} />
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}