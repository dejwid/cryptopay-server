'use client';
import {Spinner} from "@radix-ui/themes";
import axios from "axios";
import {differenceInSeconds, intervalToDuration} from "date-fns";
import {useRouter} from "next/navigation";
import {useState} from "react";
import useInterval from "use-interval";

function Timer({secondsLeft}:{secondsLeft:number|null}) {
  if (secondsLeft !== null) {
    const duration = intervalToDuration({ start: 0, end: secondsLeft * 1000 });
    const minutes = duration.minutes && Math.abs(duration.minutes);
    const minutesStr = minutes!==undefined && minutes < 10 ? '0'+minutes?.toString() : minutes?.toString();
    const seconds = Math.abs(duration.seconds || 0);
    const secondsStr = seconds < 10 ? '0'+seconds?.toString() : seconds?.toString();
    return (
      <div className="text-gray-500">
        {duration.hours && Math.abs(duration.hours) + ':'}
        {minutesStr && minutesStr + ':'}
        {secondsStr}
      </div>
    );
  }
  return <div></div>;
}

export default function AwaitingPayment({invoiceId,busyTo,isProduct}:{invoiceId:string,busyTo:Date,isProduct:boolean}) {
  const [secondsLeft, setSecondsLeft] = useState<number|null>(null);
  const [requestInProgress, setRequestInProgress] = useState(false);
  const router = useRouter();

  useInterval(() => {
    if (document.hidden || !invoiceId || requestInProgress) return;
    setRequestInProgress(true);
    axios.get(`/api/invoice/${invoiceId}/paid`).then(response => {
      setRequestInProgress(false);
      if (response.data) {
        console.log('paid -> ', response.data);
        router.refresh();
      }
    });
  }, 30 * 1000);

  useInterval(() => {
    if (document.hidden || !invoiceId) return;
    const now = new Date;
    if (busyTo > now) {
      setSecondsLeft(Math.abs(differenceInSeconds(new Date, busyTo)));
    } else {
      console.log({secondsLeft});
      router.refresh();
      setSecondsLeft(0);
    }
  }, 1000);
  
  return (
    <>
      <div className="items-center mx-auto justify-center">
        <div>
          <div className="flex gap-2 items-center justify-center">
            <Spinner/>
            <span className="font-bold" id="apm">Awaiting payment...</span>
          </div>
          {isProduct && (
            <div className="text-sm text-gray-600">
              We&apos;ll email you the product link once the payment is confirmed
            </div>
          )}
          <Timer secondsLeft={secondsLeft} />
        </div>
      </div>
    </>
  );
}