'use client';
import {useEffect, useState} from "react";
import bitcoreCash, {PrivateKey} from 'bitcore-lib-cash';

export default function GenerateAddress() {
  const [address, setAddress] = useState<PrivateKey|null>(null);
  useEffect(() => {
    setAddress(bitcoreCash.PrivateKey.fromRandom());
  }, []);

  return (
    <div>
      {JSON.stringify(address?.toAddress().toCashAddress(), null, 2)}
      <br/>
      {address?.toString()}
    </div>
  );
}