import AddressForm from "@/app/components/AddressForm";
import {Heading, Text} from "@radix-ui/themes";

export default function NewAddressPage() {
  return (
    <div>
      <Heading className="mb-2">Add wallet address</Heading>
      <Text className="block mb-4 text-gray-600">Enter one wallet address per line</Text>
      <AddressForm />
    </div>
  );
}
