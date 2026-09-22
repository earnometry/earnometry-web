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

  const baseFee = (input.views / 1_000) * input.cpm;
  const integratedFee = baseFee * integration.multiplier;
  const usageFee = integratedFee * usage.uplift;
  const exclusivityFee = integratedFee * exclusivity.uplift;
  // Both uplifts apply to the integrated fee; they are not compounded.
  const estimate = integratedFee + usageFee + exclusivityFee + input.production;

  return {
    baseFee,
    integratedFee,
    integrationMultiplier: integration.multiplier,
    usageFee,
    usageUplift: usage.uplift,
    exclusivityFee,
    exclusivityUplift: exclusivity.uplift,
    production: input.production,
    estimate,
    low: estimate * 0.8,
    high: estimate * 1.2,
  };
}

const dollars = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
});

export function formatUSD(amount: number): string {
  return dollars.format(amount);
}
