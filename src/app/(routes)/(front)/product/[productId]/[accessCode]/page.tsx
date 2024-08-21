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
  const product = session.productId
    ? await prisma.product.findFirst({where:{id:session.productId}})
    : null;
  const isProductAdmin = product?.userEmail === authSession?.user?.email;
  const hasAccess = hasAccessFromSession || isProductAdmin;
  return (
    <div>
      {!hasAccessFromSession && !authSession && (
        <AccessGetter productId={productId} accessCode={accessCode} />
      )}
      {product && hasAccess && (
        <div className="max-w-2xl flex flex-col gap-4 mx-auto p-4">
          <Heading>{product.name}</Heading>
          {product.uploads.length > 0 && product.uploads.map(upload => (
            <div key={upload}>
              <Upload url={upload} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}