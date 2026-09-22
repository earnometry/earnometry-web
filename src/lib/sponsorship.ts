export const integrationOptions = [
  { value: 'mention', label: 'Short mention', multiplier: 0.6 },
  { value: 'segment', label: 'Integrated segment', multiplier: 1 },
  { value: 'dedicated', label: 'Dedicated video', multiplier: 1.5 },
] as const;

export const usageOptions = [
  { value: 'none', label: 'None', uplift: 0 },
  { value: 'organic', label: 'Organic brand reuse', uplift: 0.2 },
  { value: 'paid', label: 'Paid advertising usage', uplift: 0.5 },
] as const;

export const exclusivityOptions = [
  { value: 'none', label: 'None', uplift: 0 },
  { value: '30-days', label: '30 days', uplift: 0.15 },
  { value: '90-days', label: '90 days', uplift: 0.3 },
] as const;

// Input guardrails, not claims about typical views, rates, or costs.
export const numericRules = {
  views: { label: 'average views', max: 1_000_000_000, whole: true },
  cpm: { label: 'base CPM', max: 10_000, whole: false },
  production: { label: 'production cost', max: 1_000_000, whole: false },
} as const;

export type NumericField = keyof typeof numericRules;
export interface SponsorshipInput {
  views: number;
  cpm: number;
  production: number;
  integration: (typeof integrationOptions)[number]['value'];
  usage: (typeof usageOptions)[number]['value'];
  exclusivity: (typeof exclusivityOptions)[number]['value'];
}

export const defaultInput: SponsorshipInput = {
  views: 50_000,
  cpm: 25,
  production: 0,
  integration: 'segment',
  usage: 'none',
  exclusivity: 'none',
};

export function numericError(raw: string, field: NumericField): string | null {
  const rule = numericRules[field];
  if (raw.trim() === '') return `Enter ${rule.label}. Use 0 if there is none.`;
  const value = Number(raw);
  if (!Number.isFinite(value)) return `Enter a valid number for ${rule.label}.`;
  if (value < 0) return `Enter 0 or more for ${rule.label}.`;
  if (value > rule.max) return `Enter ${rule.max.toLocaleString('en-US')} or less for ${rule.label}.`;
  if (rule.whole && !Number.isInteger(value)) return 'Enter a whole number of views.';
  if (!rule.whole && Number(value.toFixed(2)) !== value) {
    return `Use no more than 2 decimal places for ${rule.label}.`;
  }
  return null;
}

export function calculateSponsorship(input: SponsorshipInput) {
  for (const field of Object.keys(numericRules) as NumericField[]) {
    const error = numericError(String(input[field]), field);
    if (error) throw new RangeError(error);
  }
  const integration = integrationOptions.find((option) => option.value === input.integration);
  const usage = usageOptions.find((option) => option.value === input.usage);
  const exclusivity = exclusivityOptions.find((option) => option.value === input.exclusivity);
  if (!integration || !usage || !exclusivity) throw new RangeError('Choose a valid option for every field.');

  // Integer billionths of a dollar preserve every fraction produced by the
  // allowed inputs and multipliers, including the 80–120% range. Binary floats
  // can turn an exact $3,529.50 into $3,529.4999999999995 and round it down.
  const unitsPerDollar = 1_000_000_000n;
  const centsToUnits = (amount: number) => BigInt(Math.round(amount * 100)) * 10_000_000n;
  const percentage = (rate: number) => BigInt(Math.round(rate * 100));
  const baseFee = BigInt(input.views) * centsToUnits(input.cpm) / 1_000n;
  const integratedFee = baseFee * percentage(integration.multiplier) / 100n;
  const usageFee = integratedFee * percentage(usage.uplift) / 100n;
  const exclusivityFee = integratedFee * percentage(exclusivity.uplift) / 100n;
  const production = centsToUnits(input.production);
  // Both uplifts apply to the integrated fee; they are not compounded.
  const estimate = integratedFee + usageFee + exclusivityFee + production;
  const amounts = {
    baseFee, integratedFee, usageFee, exclusivityFee, production, estimate,
    low: estimate * 80n / 100n,
    high: estimate * 120n / 100n,
  };
  const mapAmounts = (convert: (amount: bigint) => number) => Object.fromEntries(
    Object.entries(amounts).map(([key, amount]) => [key, convert(amount)]),
  ) as Record<keyof typeof amounts, number>;

  return {
    ...mapAmounts((amount) => Number(amount / unitsPerDollar) + Number(amount % unitsPerDollar) / Number(unitsPerDollar)),
    // Round the exact values before conversion to Number. Even values just
    // below a half dollar must stay on the correct side at the upper limits.
    rounded: mapAmounts((amount) => Number((amount + unitsPerDollar / 2n) / unitsPerDollar)),
    integrationMultiplier: integration.multiplier,
    usageUplift: usage.uplift,
    exclusivityUplift: exclusivity.uplift,
  };
}

const dollars = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
});

export function formatUSD(amount: number): string {
  return dollars.format(amount);
}
