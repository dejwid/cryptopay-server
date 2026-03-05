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
        className="flex flex-col gap-3 mt-2">
        {product && (
          <input type="hidden" name="productId" value={product?.id}/>
        )}
        <div>
          <label className="block mb-1 text-sm font-medium">Name:</label>
          <TextField.Root 
            name="name" 
            defaultValue={product?.name}
            className="w-full"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">USD price:</label>
          <TextField.Root 
            name="usd" 
            type="number" 
            defaultValue={(product?.usdCents || 0)/100}
            className="w-full"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm font-medium">Description:</label>
          <TextArea 
            name="description" 
            defaultValue={product?.description}
            className="w-full min-h-[100px]"
          />
        </div>
        <div className="my-4">
          <label className="block mb-2 text-sm font-medium">Uploads:</label>
          <Uploader uploads={product?.uploads} />
        </div>
        <SubmitButton className="w-full sm:w-auto">
          Save
        </SubmitButton>
      </form>
    </div>
  );
}
