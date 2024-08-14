import {BchIcon, BtcIcon, EthIcon, LtcIcon} from "@/app/components/CryptoIcons";
import HomeStats from "@/app/components/HomeStats";
import Login from "@/app/components/Login";
import {auth} from "@/auth";
import {supportedCoins} from "@/libs/config";
import {PrismaClient} from "@prisma/client";
import {Button, Card, Heading, Text, TextArea} from "@radix-ui/themes";
import {Suspense} from "react";

export default async function Home() {
  return (
   <div>
     <div className="mb-4 flex">
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
   </div>
  );
}
