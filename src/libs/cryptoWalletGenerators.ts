// @ts-ignore
import bitcore from 'bitcore-lib';
import bitcoreCash from 'bitcore-lib-cash';
// @ts-ignore
import litecore from 'litecore-lib';
// @ts-ignore
import bitcoreDoge from 'bitcore-lib-doge';
import { Wallet as ETHWallet } from '@ethereumjs/wallet'; 

type WalletCredentials = {
  address: any;
  privateKey: string;
}

export function createWallet(coin:'btc'|'bch'|'ltc'|'doge'|'eth'):WalletCredentials {
  if (coin === 'btc') {
    const privateKey = new bitcore.PrivateKey();
    return {
      // @ts-ignore
      address: privateKey.toAddress().toString(),
      privateKey: privateKey.toString(),
    };
  }
  if (coin === 'bch') {
    const privateKey = bitcoreCash.PrivateKey.fromRandom();
    return {
      address: privateKey.toAddress().toString().replace('bitcoincash:', ''),
      privateKey: privateKey.toString(),
    }
  }
  if (coin === 'ltc') {
    const privateKey = new litecore.PrivateKey();
    return {
      address: privateKey.toAddress().toString(),
      privateKey: privateKey.toString(),
    }
  }
  if (coin === 'doge') {
    const privateKey = new bitcoreDoge.PrivateKey();
    return {
      address: privateKey.toAddress().toString(),
      privateKey: privateKey.toString(),
    };
  }
  if (coin === 'eth') {
    const wallet = ETHWallet.generate();
    return {
      address: wallet.getAddressString(),
      privateKey: wallet.getPrivateKeyString(),
    };
  }
  throw 'invalid coin '+coin;
}