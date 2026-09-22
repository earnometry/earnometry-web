export const youtubeRules = {
  views: { max: 1_000_000_000, decimals: 0 },
  rpm: { max: 10_000, decimals: 4 },
  target: { max: 1_000_000, decimals: 2 },
} as const;

export const youtubeFields = {
  longViews: { kind: 'views', label: 'monthly long-form views' },
  longRpm: { kind: 'rpm', label: 'long-form RPM' },
  shortsViews: { kind: 'views', label: 'monthly Shorts views' },
  shortsRpm: { kind: 'rpm', label: 'Shorts RPM' },
  longLow: { kind: 'rpm', label: 'low long-form RPM' },
  longHigh: { kind: 'rpm', label: 'high long-form RPM' },
  shortsLow: { kind: 'rpm', label: 'low Shorts RPM' },
  shortsHigh: { kind: 'rpm', label: 'high Shorts RPM' },
  target: { kind: 'target', label: 'monthly income target' },
} as const;

export type YouTubeField = keyof typeof youtubeFields;
export type YouTubeInput = Record<YouTubeField, string>;
type NumberKind = keyof typeof youtubeRules;
type ParsedNumber = { value: bigint | null; error: string | null };
export type Money = { numerator: bigint; denominator: bigint };
export type TargetResult =
  | { status: 'ready'; views: bigint }
  | { status: 'empty' | 'invalid' | 'unreachable'; message: string };

export function emptyYouTubeInput(): YouTubeInput {
  return Object.fromEntries(Object.keys(youtubeFields).map((name) => [name, ''])) as YouTubeInput;
}

// Parse decimal strings directly into scaled integers. Scientific notation is
// accepted too, without letting floating-point conversion erase extra digits.
export function parseYouTubeNumber(raw: string, kind: NumberKind): ParsedNumber {
  const text = raw.trim();
  const invalid = (error: string): ParsedNumber => ({ value: null, error });
  if (!text) return { value: null, error: null };
  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(text);
  if (!match || !(match[2] || match[3]) || !Number.isFinite(Number(text))) {
    return invalid('Enter a valid, finite number.');
  }
  const rule = youtubeRules[kind];
  const fraction = match[3] ?? '';
  const digits = `${match[2]}${fraction}`.replace(/^0+/, '');
  if (!digits) return { value: 0n, error: null };
  if (match[1] === '-') return invalid('Enter 0 or more.');
  const significant = digits.replace(/0+$/, '');
  const power = rule.decimals + Number(match[4] ?? 0) - fraction.length + digits.length - significant.length;
  if (power < 0) {
    return invalid(kind === 'views' ? 'Enter a whole number of views.' : `Use no more than ${rule.decimals} decimal places.`);
  }
  const max = BigInt(rule.max) * 10n ** BigInt(rule.decimals);
  const limitError = `Enter ${rule.max.toLocaleString('en-US')} or less.`;
  if (significant.length + power > String(max).length) return invalid(limitError);
  const value = BigInt(significant) * 10n ** BigInt(power);
  return value > max ? invalid(limitError) : { value, error: null };
}

// A view times a four-decimal RPM is an exact ten-millionth of a dollar.
// Keep daily revenue as a fraction as well; divide by 365 only when displaying.
const unitsPerDollar = 10_000_000n;
const money = (units: bigint, divisor = 1n): Money => ({ numerator: units, denominator: unitsPerDollar * divisor });
const integers = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatRevenue(amount: Money): string {
  const cents = (amount.numerator * 200n + amount.denominator) / (amount.denominator * 2n);
  if (cents === 0n && amount.numerator > 0n) return '<$0.01';
  return `$${integers.format(cents / 100n)}.${String(cents % 100n).padStart(2, '0')}`;
}

export function formatRpm(scaled: bigint): string {
  return (Number(scaled) / 10_000).toLocaleString('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4,
  });
}

export function formatViews(views: bigint): string {
  return integers.format(views);
}

function calculateTarget(target: ParsedNumber, rpm: ParsedNumber, label: string): TargetResult {
  if (target.error) return { status: 'invalid', message: 'Correct the monthly income target.' };
  if (rpm.error) return { status: 'invalid', message: `Correct the ${label} RPM.` };
  if (target.value === null) return { status: 'empty', message: 'Enter a monthly income target.' };
  if (target.value === 0n) return { status: 'ready', views: 0n };
  if (rpm.value === null) return { status: 'empty', message: `Enter a ${label} RPM for this alternative.` };
  if (rpm.value === 0n) return { status: 'unreachable', message: 'This target cannot be reached at a $0 RPM.' };
  // Target is cents; RPM is ten-thousandths of a dollar. Ceiling division
  // guarantees the returned count reaches the unrounded target.
  const numerator = target.value * 100_000n;
  return { status: 'ready', views: (numerator + rpm.value - 1n) / rpm.value };
}

export function evaluateYouTube(raw: YouTubeInput) {
  const errors: Partial<Record<YouTubeField, string>> = {};
  function parse(name: YouTubeField) {
    const result = parseYouTubeNumber(raw[name], youtubeFields[name].kind);
    if (result.error) errors[name] = result.error;
    return result;
  }
  const longViews = parse('longViews');
  const shortsViews = parse('shortsViews');
  const longRpm = parse('longRpm');
  const shortsRpm = parse('shortsRpm');
  const target = parse('target');
  const active = { long: longViews.value !== null && longViews.value > 0n, shorts: shortsViews.value !== null && shortsViews.value > 0n };

  if (longViews.value === null && !longViews.error) errors.longViews = 'Enter monthly long-form views. Use 0 for a Shorts-only scenario.';
  if (active.long && longRpm.value === null && !longRpm.error) errors.longRpm = 'Enter a long-form RPM. Zero is allowed.';
  if (active.shorts && shortsRpm.value === null && !shortsRpm.error) errors.shortsRpm = 'Enter a Shorts RPM. Zero is allowed.';

  const revenueValid = !(['longViews', 'shortsViews', 'longRpm', 'shortsRpm'] as const).some((name) => errors[name]);
  const longUnits = (longViews.value ?? 0n) * (longRpm.value ?? 0n);
  const shortsUnits = (shortsViews.value ?? 0n) * (shortsRpm.value ?? 0n);
  const monthlyUnits = longUnits + shortsUnits;
  const revenue = revenueValid ? {
    longForm: money(longUnits), shorts: money(shortsUnits), monthly: money(monthlyUnits),
    annual: money(monthlyUnits * 12n), daily: money(monthlyUnits * 12n, 365n),
  } : null;

  let hasRange = false;
  function bounds(enabled: boolean, rpm: ParsedNumber, lowKey: 'longLow' | 'shortsLow', highKey: 'longHigh' | 'shortsHigh') {
    if (!enabled) return null;
    const low = parse(lowKey);
    const high = parse(highKey);
    const supplied = raw[lowKey].trim() !== '' || raw[highKey].trim() !== '';
    if (!supplied) return { low: rpm.value ?? 0n, high: rpm.value ?? 0n };
    hasRange = true;
    if (!low.error && !high.error) {
      if (low.value === null || high.value === null) {
        errors[lowKey] = errors[highKey] = 'Enter both the low and high RPM, or leave both blank.';
      } else if (low.value > high.value) {
        errors[lowKey] = errors[highKey] = 'Low RPM cannot exceed high RPM.';
      } else if (rpm.value !== null) {
        if (low.value > rpm.value) errors[lowKey] = 'Low RPM must be no greater than the central RPM.';
        if (high.value < rpm.value) errors[highKey] = 'High RPM must be no less than the central RPM.';
      }
    }
    return { low: low.value ?? 0n, high: high.value ?? 0n };
  }
  const longBounds = bounds(active.long, longRpm, 'longLow', 'longHigh');
  const shortsBounds = bounds(active.shorts, shortsRpm, 'shortsLow', 'shortsHigh');
  const rangeInvalid = (['longLow', 'longHigh', 'shortsLow', 'shortsHigh'] as const).some((name) => errors[name]);
  const range = revenue && hasRange && !rangeInvalid ? {
    low: money((longViews.value ?? 0n) * (longBounds?.low ?? 0n) + (shortsViews.value ?? 0n) * (shortsBounds?.low ?? 0n)),
    high: money((longViews.value ?? 0n) * (longBounds?.high ?? 0n) + (shortsViews.value ?? 0n) * (shortsBounds?.high ?? 0n)),
    long: longBounds, shorts: shortsBounds,
  } : null;

  return {
    errors, active, revenue, range,
    rangeMessage: !revenue ? 'Enter valid views and RPMs to see a planning range.'
      : rangeInvalid ? 'Complete or correct the planning RPM pairs.'
      : 'Add low and high RPM assumptions for at least one active format to see a range.',
    targets: { long: calculateTarget(target, longRpm, 'long-form'), shorts: calculateTarget(target, shortsRpm, 'Shorts') },
  };
}
