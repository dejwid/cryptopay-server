import {getSession} from "@/app/actions/sessionActions";
import AccessGetter from "@/app/components/AccessGetter";
import Upload from "@/app/components/Upload";
import {auth} from "@/auth";
import {prisma} from "@/libs/db";
import {Heading} from "@radix-ui/themes";

export default async function ProductPage({params:{productId,accessCode}}:{params:{productId:string;accessCode:string;}}) {
  const session = await getSession();
  const hasAccessFromSession = session.productId === productId;
  const authSession = await auth();
  const product = await prisma.product.findFirst({where:{id:productId}});
  const isProductAdmin = product?.userEmail === authSession?.user?.email;
  const hasAccess = hasAccessFromSession || isProductAdmin;
  return (
    <div>
      {!hasAccessFromSession && !authSession && (
        <AccessGetter productId={productId} accessCode={accessCode} />
      )}
      {product && hasAccess && (
        <div className="max-w-2xl flex flex-col gap-4 mx-auto py-4">
          <Heading>{product.name}</Heading>
          {product.uploads.length > 0 && product.uploads.map(upload => (
            <div key={upload} className="bg-gray-200 rounded-md">
              <h3 className="text-center py-2">
                {upload.split('/').pop()?.split('-').slice(1).join('-')}
              </h3>
              <Upload url={upload} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}