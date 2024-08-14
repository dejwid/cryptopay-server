import ProductForm from "@/app/components/ProductForm";
import {Heading} from "@radix-ui/themes";

export default async function NewProductPage() {
  return (
    <div>
      <Heading>New product</Heading>
      <ProductForm />
    </div>
  );
}