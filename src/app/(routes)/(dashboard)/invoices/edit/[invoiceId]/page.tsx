import InvoiceForm from "@/app/components/InvoiceForm";
import {prisma} from "@/libs/db";
import {Heading} from "@radix-ui/themes";

export default async function EditInvoicePage({
  params: {invoiceId}
}: {
  params: {
    invoiceId: string;
  };
}) {
  const invoice = await prisma.invoice.findFirstOrThrow({where:{id:invoiceId}});
  return (
    <div>
      <Heading className="mb-4">Edit invoice: {invoice.title}</Heading>
      <InvoiceForm invoice={invoice} />
    </div>
  );
}