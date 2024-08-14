import InvoiceForm from "@/app/components/InvoiceForm";
import {Heading} from "@radix-ui/themes";

export default async function NewInvoicePage() {
  return (
    <div>
      <Heading className="mb-4">New invoice</Heading>
      <InvoiceForm />
    </div>
  );
}