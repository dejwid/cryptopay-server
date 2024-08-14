import {BitcoinIcon} from "lucide-react";

export const BtcIcon = ({className="size-8"}) => <BitcoinIcon className={"bg-yellow-500 text-white p-1 rounded-full "+className}/>
export const BchIcon = ({className="size-8"}) => <BitcoinIcon className={"bg-emerald-500 text-white p-1 rounded-full "+className}/>
export const LtcIcon = ({className="size-8"}) => <img src="/ltc.png" alt="" className={className}/>
export const EthIcon = ({className="size-8"}) => <img src="/eth.png" alt="" className={className}/>
