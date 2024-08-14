import {BchIcon, BtcIcon, EthIcon, LtcIcon} from "@/app/components/CryptoIcons";
import {RadioGroup} from "@radix-ui/themes";

export default function CryptoRadioGroup({
  name="code",
  required=true,
}:{
  name?:string;
  required?:boolean;
}) {
  return (
    <div>
      <RadioGroup.Root required={required} name={name}>
        <RadioGroup.Item value="btc" className="has-[:checked]:border">
          <div className="flex gap-1 items-center">
            <BtcIcon className="size-6" /> Bitcoin
          </div>
        </RadioGroup.Item>
        <RadioGroup.Item value="bch" className="has-[:checked]:border">
          <div className="flex gap-1 items-center">
            <BchIcon className="size-6" /> Bitcoin cash
          </div>
        </RadioGroup.Item>
        <RadioGroup.Item value="ltc" className="has-[:checked]:border">
          <div className="flex gap-1 items-center">
            <LtcIcon className="size-6" /> Litecoin
          </div>
        </RadioGroup.Item>
        <RadioGroup.Item value="eth" className="has-[:checked]:border">
          <div className="flex gap-1 items-center">
            <EthIcon className="size-6" /> Ethereum
          </div>
        </RadioGroup.Item>
      </RadioGroup.Root>
    </div>
  );
}