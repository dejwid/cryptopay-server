'use server';

import {userEmailOrThrow} from "@/app/actions/actions";
import {CoinCode, usdToCoin} from "@/libs/cryptoPrices";
import {prisma} from "@/libs/db";

export async function saveInvoice(data:FormData) {
  const invoiceId = data.get('invoiceId') as string|null;
  const name = data.get('name') as string;
  const usdAmount = parseInt(data.get('amount') as string);
  const adminEmail = await userEmailOrThrow();
  const editableCoin = data.get('editableCoinCode') === 'y';
  const coinCode =  data.get('coinCode') as CoinCode|null;
  const allowedCoins = data.getAll('allowedCoins') as string[]|null;
  const coinAmount10pow10 = coinCode
    ? (await usdToCoin(usdAmount, coinCode)) * 10**10
    : null;

  if (invoiceId) {
    const invoice = await prisma.invoice.findFirstOrThrow({
      where:{id:invoiceId as string, payeeEmail:adminEmail}
    });
    if (invoice.paidAt) return;
    const updateData = {
      title: name,
      usdAmountCents: usdAmount * 100,
      editableCoinCode: editableCoin,
      allowedCoins: allowedCoins || [],
      coinCode: coinCode,
      coinAmount10pow10,
    };
    console.log({coinAmount10pow10});
    return prisma.invoice.update({
      data:updateData,
      where: {
        id: invoice.id,
      },
    });
  } else {
    // creating
    return prisma.invoice.create(({
      data:{
        title: name,
        payeeEmail: adminEmail,
        usdAmountCents: usdAmount * 100,
        editableCoinCode: editableCoin,
        allowedCoins: allowedCoins || [],
        coinCode: coinCode,
        coinAmount10pow10,
      },
    }));
  }
}

export async function selectInvoiceCoin(data: FormData) {
  const invoiceId = data.get('invoiceId') as string;
  const coin = data.get('coin') as CoinCode;
  const invoice = await prisma.invoice.findFirstOrThrow({where:{id:invoiceId}});
  if (invoice.usdAmountCents && invoice.editableCoinCode && invoice.allowedCoins.includes(coin)) {
    await prisma.invoice.update({
      data: {
        coinCode: coin,
        coinAmount10pow10: (await usdToCoin(invoice.usdAmountCents/100, coin)) * 10**10,
      },
      where: {id: invoiceId},
    });
  }
}