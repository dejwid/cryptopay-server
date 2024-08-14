'use client';
import {sendAccessLinkAction} from "@/app/actions/actions";
import SubmitButton from "@/app/components/SubmitButton";
import {Heading, Text, TextField} from "@radix-ui/themes";
import axios from "axios";
import {SendHorizonalIcon, SendIcon} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

export default function AccessGetter({productId,accessCode}:{productId:string;accessCode:string}) {
  const router = useRouter();
  const [result, setResult] = useState<null|boolean>(null);
  const [sent, setSent] = useState(false);
  useEffect(() => {
    axios.get(`/api/access?productId=${productId}&accessCode=${accessCode}`).then(response => {
      console.log({d:response.data});
      setResult(response.data);
      if (response.data) {
        router.refresh();
      }
    });
  }, []);
  if (sent) {
    return (
      <div>
        Email sent
      </div>
    );
  }
  if (result === false) {
    return (
      <form action={async data => {
        await sendAccessLinkAction(data);
        setSent(true);
      }}>
        <div className="mb-4">
          <Heading className="mb-2">Access Denied</Heading>
          <Text>
            You do not have permission to view this content.<br />
            Enter your email to receive a new access link.
          </Text>
        </div>
        <TextField.Root size="3" name="email" placeholder="email" />
        <input type="hidden" name="productId" value={productId}/>
        <div className="flex flex-col mt-2">
          <div className="w-full"></div>
          <SubmitButton size="4">
            Send access link
            <SendHorizonalIcon className="w-6 h-6" />
          </SubmitButton>
        </div>
      </form>
    );
  }
  return (
    <>

    </>
  );
}