import ProductForm from "@/app/components/ProductForm";
import {Heading} from "@radix-ui/themes";

export default async function NewProductPage() {
  return (
    <div>
      <Heading className="mb-4">New product</Heading>
      <ProductForm />
    </div>
  );
}
