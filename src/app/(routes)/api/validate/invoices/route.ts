import {validateInvoicePayment} from "@/app/actions/actions";
import {prisma} from "@/libs/db";

export async function GET() {
  const invoices = await prisma.invoice.findMany({
    where: {
      OR:[
        {paidAt:null},
        {paidAt:{isSet:false}},
      ],
    },
  });
  const result = [];
  for (let invoice of invoices) {
    result.push(await validateInvoicePayment(invoice));
  }
  return Response.json(result);
}