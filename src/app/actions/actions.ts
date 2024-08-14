'use server';
import {auth} from "@/auth";
import {maxPaymentShortfall, transactionAwaitSeconds} from "@/libs/config";
import {usdToCoinClient} from "@/libs/crypto-client";
import {getCryptoBalance} from "@/libs/cryptoBalances";
import {CoinCode, getCryptoPrices} from "@/libs/cryptoPrices";
import {prisma} from "@/libs/db";
import {sendEmail} from "@/libs/mail";
import {Address, Invoice, User} from "@prisma/client";
import {addSeconds, isPast} from "date-fns";

export async function getUser(): Promise<User|null> {
  const session = await auth();
  if (!session?.user?.email) return null;
  return prisma.user.findFirst({where:{email:session.user.email}})
}

export async function getUserEmail(): Promise<string|null> {
  const session = await auth();
  return session?.user?.email || null;
}
export async function userEmailOrThrow(): Promise<string> {
  const session = await auth();
  if (!session?.user?.email) throw 'no email for logged in user';
  return session?.user?.email;
}

export async function addWalletAddressesAction(data: FormData) {
  const addresses = data.get('addresses') as string;
  const code = (data.get('code') as string).toLowerCase() as 'btc'|'bch'|'ltc'|'eth';
  const userEmail = await userEmailOrThrow();
  for (let address of addresses.split("\n")) {
    if (address.length > 0) {
      const amount = await getCryptoBalance(code, address.toLowerCase(), 0);
      await prisma.address.create({
        data: {
          userEmail,
          code: code.toLowerCase(),
          address: address.toLowerCase().replace(/[^0-9a-zA-Z]/g, ''),
          lastBalance10pow10: amount ? amount*10**10 : null,
          balanceUpdatedAt: amount ? new Date : null,
        },
      });
    }
  }
}
export async function saveProductAction(data: FormData) {
  const userEmail = await userEmailOrThrow();
  const productId = data.get('productId') as string;
  const productData = {
    name: data.get('name') as string,
    description: data.get('description') as string,
    uploads: data.getAll('uploads') as string[],
    usdCents: Number(data.get('usd')) * 100,
  };
  if (productId) {
    return prisma.product.update({where:{id:productId,userEmail}, data:productData});
  } else {
    return prisma.product.create({data:{...productData,userEmail}});
  }
}
export async function createProductInvoice(data: FormData) {
  const productId = data.get('productId') as string;
  const product = await prisma.product.findFirst({where:{id:productId}});
  if (!product?.usdCents) throw 'product not found: '+productId;
  const coin = data.get('coin') as CoinCode;
  const amount = usdToCoinClient(product.usdCents/100, (await getCryptoPrices())?.[coin]);
  return prisma.invoice.create({
    data: {
      title: `${product.name}`,
      payeeEmail: product.userEmail as string,
      productId: data.get('productId') as string,
      payerEmail: data.get('email') as string,
      coinCode: coin,
      coinAmount10pow10: Number(amount) * 10**10,
      usdAmountCents: product.usdCents,
    },
  })
}
export async function getAddressForInvoice(invoiceId: string): Promise<Address|false> {

  const invoice = await prisma.invoice.findFirst({where:{id:invoiceId}});

  if (!invoice) throw `invoice ${invoiceId} not found`;

  // check if existing in addresses
  const existingWhere = {
    invoiceId,
    userEmail:invoice.payeeEmail,
  };
  const existingAddress = await prisma.address.findFirst({
    where: existingWhere
  });
  if (existingAddress) {
    console.log('found existing address');
    if (existingAddress.busyTo && isPast(existingAddress.busyTo)) {
      console.log({bt:existingAddress.busyTo});
      // set busyTo to the future
      return prisma.address.update({
        where: {id:existingAddress.id},
        data: {busyTo:addSeconds(new Date, transactionAwaitSeconds)},
      });
    }
    return existingAddress;
  } else {
    console.log('existing not found');
    console.log(existingWhere);
  }

  if (!invoice.coinCode) {
    console.error('no coinCode on this invoice: '+invoice.id);
    return false;
  }

  // find first idle and mark it
  const idleWhere = {
    userEmail: invoice.payeeEmail,
    code: invoice.coinCode,
    AND: [
      {
        OR: [
          {busyTo: {isSet: false},},
          {busyTo: null},
          {busyTo: { lt:new Date() }}
        ]
      },
    ],
  };

  console.log({idleWhere});

  // find and update idle
  const idleAddress = await prisma.address.findFirst({where:idleWhere,orderBy:{busyTo:'asc'}});
  if (idleAddress) {
    console.log('found idle address');
    const newBalance = await getCryptoBalance(invoice.coinCode as CoinCode, idleAddress.address, 0);
    return prisma.address.update({
      where: {id:idleAddress.id},
      data:{
        busyFrom: new Date,
        busyTo: addSeconds(new Date, transactionAwaitSeconds),
        invoiceId,
        lastBalance10pow10: (newBalance||0)*10**10,
        balanceUpdatedAt: new Date,
      }
    });
  }

  console.error('no available addresses');
  return false;

  // create new one and mark it
  // console.log('creating address');
  // const wallet = createWallet(invoice.coinCode as 'btc' | 'bch');
  // return prisma.address.create({
  //   data: {
  //     ...busyUpdate,
  //     userEmail: invoice.payeeEmail,
  //     address: wallet.address,
  //     privateKey: wallet.privateKey,
  //     code: invoice.coinCode,
  //   },
  // });
}

export async function updateAddressBalanceAction(walletId: string) {
  const address = await prisma.address.findFirstOrThrow({where:{id:walletId}});
  const newBalance = await getCryptoBalance(address.code as CoinCode, address.address, 0);
  if (newBalance) {
    await prisma.address.update({
      where: {id:walletId},
      data: {lastBalance10pow10: newBalance * 10**10},
    });
  }
  return newBalance;
}

export async function archiveProductAction(productId:string) {
  await prisma.product.update({ where:{id:productId,userEmail:await userEmailOrThrow()}, data:{archivedAt:new Date} });
}

export async function validateInvoicePayment(invoice:Invoice):Promise<Invoice> {
  if (invoice.paidAt || !invoice.coinAmount10pow10) {
    return invoice;
  }

  const address = await prisma.address.findFirst({
    where:{
      invoiceId:invoice.id,
    },
    orderBy: {
      busyFrom: 'desc',
    }
  });

  if (address && address.busyFrom && address.busyTo) {
    await getCryptoBalance(address.code as CoinCode, address.address, 0);
    const payment = await prisma.balanceChange.findFirst({
      where: {
        addressId: address.id,
        // balance +/- 10%
        balanceChange10pow10: {
          gte: (1 - maxPaymentShortfall) * invoice.coinAmount10pow10,
          lte: (1 + maxPaymentShortfall) * invoice.coinAmount10pow10,
        },
        // createdAt between busyFrom and to
        createdAt: {
          gte: address.busyFrom,
          lte: address.busyTo,
        },
      },
    });
    if (payment) {
      // mark invoice as paid
      const updatedInvoice = await prisma.invoice.update({
        where: {id: invoice.id},
        data: {
          paidAt: payment.createdAt,
          paidToAddressId: address.id,
          paidByBalanceChangeId: payment.id,
        },
      });
      // release the address
      await prisma.address.update({
        where: {id: address.id},
        data: {busyFrom: null, busyTo: null, invoiceId: null},
      });
      // send email to the payer
      if (invoice.productId) {
        await createAndSendProductLink(invoice.productId, invoice.payerEmail);
      }
      // email to the payee
      await sendEmail(
        [invoice.payeeEmail],
        'You just got paid',
        `${invoice.title}: ${invoice.coinAmount10pow10/10**10} ${invoice.coinCode} ~ $${invoice.usdAmountCents/100}USD`
      );

      return updatedInvoice;
    }
  }
  return invoice;
}

function randomIntFromInterval(min:number, max:number) { // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export async function createAndSendProductLink(productId:string,email:string|null=null) {
  const accessCode = randomIntFromInterval(1000,9999).toString();
  await prisma.productAccessCode.create({
    data: {
      productId,
      accessCode,
      emailedTo: email,
    },
  });
  if (email) {
   await sendEmail([email], 'Product access', process.env.NEXTAUTH_URL+`/product/${productId}/${accessCode}`);
  }
}

export async function isFirstTimeProductCodeUse(productId:string,accessCode:string) {
  const productAccessCode = await prisma.productAccessCode.findFirst({where:{productId,accessCode,activatedAt:{isSet:false}}});
  if (!productAccessCode) {
    return false;
  }
  // mark as used
  await prisma.productAccessCode.update({where:{id:productAccessCode.id},data:{activatedAt:new Date}});
  return true;
}

export async function sendAccessLinkAction(formData:FormData) {
  const email = formData.get('email') as string;
  const productId = formData.get('productId') as string;
  const invoice = await prisma.invoice.findFirst({where:{payerEmail:email,productId,paidAt:{isSet:true}}});
  if (invoice) {
    await createAndSendProductLink(productId, email);
    return true;
  } else {
    return false;
  }
}