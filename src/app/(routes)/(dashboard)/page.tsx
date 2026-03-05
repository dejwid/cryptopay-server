import HomeStats from "@/app/components/HomeStats";
import { getUserEmail } from "@/app/actions/actions";

import {Heading, Text, Flex,} from "@radix-ui/themes";
import {Suspense} from "react";

export default async function Home() {
  await getUserEmail();
  
  return (
    <div className="p-4">
      <div className="mb-4">
        <Heading size="5">Home</Heading>
        <Text size="2" color="gray">Wallet overview</Text>
      </div>
      <Suspense fallback="Loading...">
        <HomeStats />
      </Suspense>
    </div>
  );
}
