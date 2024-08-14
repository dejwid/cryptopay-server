import {CoinCode, CryptoPrices} from "@/libs/cryptoPrices";

export function usdToCoinClient(usdPrice:number, coinPrice:number, roundToCent:boolean=true) {

  if (!roundToCent) {
    return (usdPrice / coinPrice);
  }

  const oneCentInCrypto = 0.01 / coinPrice;

  // Get the index of that first non-zero digit
  let firstNonZeroIndex = oneCentInCrypto.toFixed(20).split('').findIndex(a => a!=='0' && a!=='.');

  // Calculate the number of decimal places needed
  const decimalPlaces = firstNonZeroIndex - 2 + 1; // Subtract 2 to ignore "0.", add 1 to include the first significant digit

  // Calculate and round the price in BTC
  const priceInCrypto = usdPrice / coinPrice;

  return parseFloat(priceInCrypto.toFixed(decimalPlaces));
}
export function coinToUsdClient(coinAmount:number, coin:CoinCode, cryptoPrices:CryptoPrices) {
  return coinAmount * cryptoPrices?.[coin];
}

export const cryptoNames = {
  btc: 'Bitcoin',
  bch: 'Bitcoin cash'
};

export function paymentUri(coinCode:CoinCode, address:string, coinAmount:number) {
  if (coinCode === 'btc') {
    return `bitcoin:${address}?amount=${coinAmount}`;
  }
  if (coinCode === 'bch') {
    return `bitcoincash:${address}?amount=${coinAmount}`;
  }
  if (coinCode === 'ltc') {
    return `litecoin:${address}?amount=${coinAmount}`;
  }
  if (coinCode === 'eth') {
    return `ethereum:${address}?amount=${coinAmount}`;
  }
  throw `unsupported coin: ${coinCode}`;
}