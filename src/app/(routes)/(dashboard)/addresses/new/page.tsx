import AddressForm from "@/app/components/AddressForm";
import {Heading, Text} from "@radix-ui/themes";

export default function NewAddressPage() {
  return (
    <div>
      <Heading>Add wallet address</Heading>
      <Text>one per line</Text>
      <AddressForm />
    </div>
  );
}