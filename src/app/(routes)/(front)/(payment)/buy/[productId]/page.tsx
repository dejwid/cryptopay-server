import BuyForm from "@/app/components/BuyForm";
import {CoinCode, getCryptoPrices} from "@/libs/cryptoPrices";
import {prisma} from "@/libs/db";
import {Button, Card, Heading, RadioCards, TextField} from "@radix-ui/themes";

export default async function BuyProductPage({
  params: {
    productId,
  },
}:{
  params: {
    productId: string;
  };
}) {
  const product = await prisma.product.findFirst({where:{id:productId}});
  if (!product?.userEmail) {
    return '404';
  }
  const prices = await getCryptoPrices();
  const availableCoins = (await prisma.address.findMany({
    where: {userEmail: product.userEmail},
    distinct: ['code'],
    select: {code: true},
  })).map(a => a.code) as CoinCode[];
  return (
    <>
      <Heading size="5" className="mt-4 mb-2 text-gray-500">{product.name}</Heading>
      <Heading size="8" className="mb-6">${(product.usdCents || 0) / 100} USD</Heading>
      <BuyForm product={product} cryptoPrices={prices} availableCoins={availableCoins} />
    </>
  );
}