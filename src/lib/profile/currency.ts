export const SUPPORTED_CURRENCIES = [
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export function isSupportedCurrencyCode(value: string | null | undefined): value is SupportedCurrencyCode {
  return SUPPORTED_CURRENCIES.some((currency) => currency.code === value);
}

export function getCurrencyMeta(code: string | null | undefined) {
  return SUPPORTED_CURRENCIES.find((currency) => currency.code === code) ?? SUPPORTED_CURRENCIES[0];
}
