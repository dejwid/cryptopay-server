'use client';
import {saveProductAction} from "@/app/actions/actions";
import SubmitButton from "@/app/components/SubmitButton";
import Uploader from "@/app/components/Uploader";
import {Product} from "@prisma/client";
import {Button, TextArea, TextField} from "@radix-ui/themes";
import {useRouter} from "next/navigation";

export default function ProductForm({product}:{product?:Product}) {
  const router = useRouter();
  return (
    <div>
      <form
        action={async data => {
          await saveProductAction(data);
          router.push('/products');
          router.refresh();
        }}
        className="flex flex-col gap-2 mt-2">
        {product && (
          <input type="hidden" name="productId" value={product?.id}/>
        )}
        <div>
          Name:
          <TextField.Root name="name" defaultValue={product?.name} />
        </div>
        <div>
          USD price:
          <TextField.Root name="usd" type="number" defaultValue={(product?.usdCents || 0)/100} />
        </div>
        <div>
          Description:
          <TextArea name="description" defaultValue={product?.description} />
        </div>
        <div className="my-4">
          <Uploader uploads={product?.uploads} />
        </div>
        <SubmitButton>
          Save
        </SubmitButton>
      </form>
    </div>
  );
}