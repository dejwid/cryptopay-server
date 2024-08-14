import {validateInvoicePayment} from "@/app/actions/actions";
import {prisma} from "@/libs/db";
import {NextRequest} from "next/server";

export const revalidate = 0;
export const dynamic = 'force-dynamic'

export async function GET(req:NextRequest, {params}:{params:{invoiceId:string}}) {
  const payment = await validateInvoicePayment(
    await prisma.invoice.findFirstOrThrow({
      where:{id:params.invoiceId}
    })
  );
  return Response.json(payment?.paidAt || false);
}