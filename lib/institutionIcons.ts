export type InstitutionIconGroup = 'banco' | 'digital' | 'cripto';

export type InstitutionIcon = {
  key: string;
  label: string;
  group: InstitutionIconGroup;
  source: number;
};

export const INSTITUTION_ICONS: InstitutionIcon[] = [
  { key: 'caixabank', label: 'CaixaBank', group: 'banco', source: require('@/assets/institutions/caixabank.png') },
  { key: 'santander', label: 'Santander', group: 'banco', source: require('@/assets/institutions/santander.png') },
  { key: 'bbva', label: 'BBVA', group: 'banco', source: require('@/assets/institutions/bbva.png') },
  { key: 'sabadell', label: 'Banco Sabadell', group: 'banco', source: require('@/assets/institutions/sabadell.png') },
  { key: 'bankinter', label: 'Bankinter', group: 'banco', source: require('@/assets/institutions/bankinter.png') },
  { key: 'ing', label: 'ING', group: 'banco', source: require('@/assets/institutions/ing.png') },
  { key: 'unicaja', label: 'Unicaja', group: 'banco', source: require('@/assets/institutions/unicaja.png') },
  { key: 'abanca', label: 'Abanca', group: 'banco', source: require('@/assets/institutions/abanca.png') },
  { key: 'kutxabank', label: 'Kutxabank', group: 'banco', source: require('@/assets/institutions/kutxabank.png') },

  { key: 'revolut', label: 'Revolut', group: 'digital', source: require('@/assets/institutions/revolut.png') },
  { key: 'n26', label: 'N26', group: 'digital', source: require('@/assets/institutions/n26.png') },
  { key: 'wise', label: 'Wise', group: 'digital', source: require('@/assets/institutions/wise.png') },
  { key: 'paypal', label: 'PayPal', group: 'digital', source: require('@/assets/institutions/paypal.png') },

  { key: 'bitcoin', label: 'Bitcoin', group: 'cripto', source: require('@/assets/institutions/bitcoin.png') },
  { key: 'ethereum', label: 'Ethereum', group: 'cripto', source: require('@/assets/institutions/ethereum.png') },
  { key: 'tether', label: 'Tether', group: 'cripto', source: require('@/assets/institutions/tether.png') },
  { key: 'binance', label: 'Binance', group: 'cripto', source: require('@/assets/institutions/binance.png') },
  { key: 'solana', label: 'Solana', group: 'cripto', source: require('@/assets/institutions/solana.png') },
  { key: 'ripple', label: 'Ripple (XRP)', group: 'cripto', source: require('@/assets/institutions/ripple.png') },
  { key: 'cardano', label: 'Cardano', group: 'cripto', source: require('@/assets/institutions/cardano.png') },
  { key: 'dogecoin', label: 'Dogecoin', group: 'cripto', source: require('@/assets/institutions/dogecoin.png') },
  { key: 'polkadot', label: 'Polkadot', group: 'cripto', source: require('@/assets/institutions/polkadot.png') },
  { key: 'polygon', label: 'Polygon', group: 'cripto', source: require('@/assets/institutions/polygon.png') },
  { key: 'litecoin', label: 'Litecoin', group: 'cripto', source: require('@/assets/institutions/litecoin.png') },
  { key: 'bitcoincash', label: 'Bitcoin Cash', group: 'cripto', source: require('@/assets/institutions/bitcoincash.png') },
  { key: 'chainlink', label: 'Chainlink', group: 'cripto', source: require('@/assets/institutions/chainlink.png') },
  { key: 'stellar', label: 'Stellar', group: 'cripto', source: require('@/assets/institutions/stellar.png') },
  { key: 'monero', label: 'Monero', group: 'cripto', source: require('@/assets/institutions/monero.png') },
];

const BY_KEY = new Map(INSTITUTION_ICONS.map((i) => [i.key, i]));

export function getInstitutionIcon(key: string | null | undefined): InstitutionIcon | null {
  if (!key) return null;
  return BY_KEY.get(key) ?? null;
}
