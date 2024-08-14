import ProductForm from "@/app/components/ProductForm";
import {prisma} from "@/libs/db";
import {Heading} from "@radix-ui/themes";

export default async function EditProductPage({
  params: {productId}
}: {
  params: {
    productId: string;
  };
}) {
  const product = await prisma.product.findFirstOrThrow({where:{id:productId}});
  return (
    <div>
      <Heading>Edit product: {product.name}</Heading>
      <ProductForm product={product} />
    </div>
  );
}