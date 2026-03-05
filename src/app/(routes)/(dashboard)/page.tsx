import HomeStats from "@/app/components/HomeStats";
import Login from "@/app/components/Login";
import TestEmailButton from "@/app/components/TestEmailButton";
import { getUserEmail } from "@/app/actions/actions";

import {Heading, Card, Text, Flex,} from "@radix-ui/themes";
import {Suspense} from "react";

export default async function Home() {
  const userEmail = await getUserEmail();
  
  return (
   <div>
     <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
       <div className="grow">
         <Heading>Home</Heading>
       </div>
       <div className=""><Login /></div>
     </div>
      <div>
        <Suspense fallback="Loading...">
          <HomeStats />
        </Suspense>
      </div>
     
     {/* Email Testing Section */}
     <Card className="mt-6">
       <Flex direction="column" gap="3">
         <Flex direction="column" gap="1">
           <Heading size="4">Email Testing</Heading>
           <Text size="2" color="gray">Send a test email to verify your email configuration is working correctly.</Text>
         </Flex>
         <TestEmailButton defaultEmail={userEmail || ''} />
       </Flex>
     </Card>
   </div>
  );
}
