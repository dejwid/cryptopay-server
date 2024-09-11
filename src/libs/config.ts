export const transactionAwaitSeconds = 60 * 60;
export const maxPaymentShortfall = .1;
export const supportedCoins = ['btc', 'bch', 'ltc', 'eth'];
export type SupportedCoin = 'btc'|'bch'|'ltc'|'eth';
export const testWallets: Record<SupportedCoin, string> = {
  'btc': 'bc1qak70c84rale7e5p6vm3wcds7ylpalxa0aml3tc',
  'ltc': 'ltc1qga0mz2l344vhrgjdcaep35j4wu8ueh8qjdkmtl',
  'bch': 'qzzqpq2qys34vc8lhfgfdtv9yrcjuwue9gyxds4rnt',
  'eth': '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
};