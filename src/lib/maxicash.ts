export type MaxiCashEnvironment = 'sandbox' | 'live';

export interface MaxiCashConfig {
  environment: MaxiCashEnvironment;
  merchantId: string;
  merchantPassword: string;
  payEntryPostUrl: string;
  payEntryWebUrl: string;
  gatewayBaseUrl: string;
}

export function getMaxiCashConfig(): MaxiCashConfig {
  const environment = (process.env.MAXICASH_ENV === 'live' ? 'live' : 'sandbox') as MaxiCashEnvironment;
  const merchantId = process.env.MAXICASH_MERCHANT_ID || '';
  const merchantPassword = process.env.MAXICASH_MERCHANT_PASSWORD || '';
  const payEntryPostUrl =
    process.env.MAXICASH_PAY_ENTRY_POST_URL ||
    (environment === 'live'
      ? 'https://api.maxicashapp.com/PayEntryPost'
      : 'https://api-testbed.maxicashapp.com/PayEntryPost');
  const payEntryWebUrl =
    process.env.MAXICASH_PAY_ENTRY_WEB_URL ||
    (environment === 'live'
      ? 'https://webapi.maxicashapp.com/Integration/PayEntryWeb'
      : 'https://webapi-test.maxicashapp.com/Integration/PayEntryWeb');
  const gatewayBaseUrl =
    process.env.MAXICASH_GATEWAY_BASE_URL ||
    (environment === 'live'
      ? 'https://api.maxicashapp.com'
      : 'https://api-testbed.maxicashapp.com');

  return { environment, merchantId, merchantPassword, payEntryPostUrl, payEntryWebUrl, gatewayBaseUrl };
}

export function assertMaxiCashConfig(config = getMaxiCashConfig()) {
  if (!config.merchantId || !config.merchantPassword) {
    throw new Error('Configuration MaxiCash manquante: MAXICASH_MERCHANT_ID et MAXICASH_MERCHANT_PASSWORD requis.');
  }
}

export function toMaxiCashCents(amount: number) {
  return Math.round(amount * 100);
}

export function generateMaxiCashReference(userId: string) {
  const cleanUser = userId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'USER';
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MXC-${cleanUser}-${Date.now()}-${random}`;
}

export function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isSuccessfulMaxiCashStatus(status: unknown) {
  const normalized = String(status || '').trim().toLowerCase();
  return ['success', 'successful', 'completed', 'complete', 'paid', 'approved', 'ok', 'succeeded', 'succes'].includes(normalized);
}

export function isFailedMaxiCashStatus(status: unknown) {
  const normalized = String(status || '').trim().toLowerCase();
  return ['failed', 'failure', 'declined', 'decline', 'cancelled', 'canceled', 'error', 'rejected'].includes(normalized);
}

export function extractMaxiCashStatus(payload: Record<string, any>, fallback?: string) {
  return (
    payload.status ||
    payload.Status ||
    payload.ResponseStatus ||
    payload.responseStatus ||
    payload.TransactionStatus ||
    payload.transactionStatus ||
    payload.PaymentStatus ||
    payload.paymentStatus ||
    payload.result ||
    payload.Result ||
    fallback ||
    ''
  );
}
