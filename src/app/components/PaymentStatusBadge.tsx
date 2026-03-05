import {Text} from "@radix-ui/themes";
import {BadgeAlert, BadgeCheck, AlertTriangleIcon} from "lucide-react";
import {maxPaymentShortfall} from "@/libs/config";

// Calculate thresholds: 90-110% is acceptable (using maxPaymentShortfall = 0.1)
const minAcceptablePercentage = (1 - maxPaymentShortfall) * 100; // 90%
const maxAcceptablePercentage = (1 + maxPaymentShortfall) * 100; // 110%

interface PaymentStatusBadgeProps {
  paidAt: Date | null;
  manuallyApprovedAt?: Date | null;
  receivedAmount10pow10: number | null;
  paymentPercentage: number | null;
  coinCode?: string | null;
}

export function PaymentStatusBadge({ paidAt, manuallyApprovedAt, receivedAmount10pow10, paymentPercentage, coinCode }: PaymentStatusBadgeProps) {
  if (paidAt) {
    return (
      <Text color="green" className="flex gap-1 items-center">
        <BadgeCheck className="w-4 h-4" />
        Paid
        {manuallyApprovedAt && (
          <span className="text-xs bg-orange-100 text-orange-700 px-1 rounded ml-1">manual</span>
        )}
      </Text>
    );
  }
  
  if (receivedAmount10pow10 !== null && receivedAmount10pow10 > 0) {
    return (
      <div className="flex flex-col gap-1">
        {paymentPercentage! > maxAcceptablePercentage ? (
          <Text className="flex gap-1 items-center text-purple-600">
            <BadgeCheck className="w-4 h-4" />
            Overpaid
          </Text>
        ) : paymentPercentage! >= minAcceptablePercentage ? (
          <Text color="green" className="flex gap-1 items-center">
            <BadgeCheck className="w-4 h-4" />
            Acceptable
          </Text>
        ) : (
          <Text color="red" className="flex gap-1 items-center">
            <AlertTriangleIcon className="w-4 h-4" />
            Underpaid
          </Text>
        )}
        <Text size="1" className="text-gray-600">
          {(receivedAmount10pow10 / 10**10).toFixed(8)} {coinCode?.toUpperCase()}
        </Text>
        <Text size="1" className={
          paymentPercentage! > maxAcceptablePercentage 
            ? "text-purple-600 font-bold" 
            : paymentPercentage! < minAcceptablePercentage 
              ? "text-red-600 font-bold" 
              : "text-green-600"
        }>
          {paymentPercentage!.toFixed(1)}%
        </Text>
      </div>
    );
  }
  
  return (
    <Text color="red" className="flex gap-1 items-center">
      <BadgeAlert className="w-4 h-4" />
      No payment
    </Text>
  );
}
