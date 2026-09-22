import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateSponsorship, defaultInput, formatUSD, numericError,
  integrationOptions, usageOptions, exclusivityOptions,
} from '../src/lib/sponsorship.ts';

test('the specification example uses additive uplifts and adds production last', () => {
  const result = calculateSponsorship({ ...defaultInput, usage: 'organic', exclusivity: '30-days', production: 100 });
  assert.equal(result.baseFee, 1250);
  assert.equal(result.integratedFee, 1250);
  assert.equal(result.usageFee, 250);
  assert.equal(result.exclusivityFee, 187.5);
  assert.equal(result.estimate, 1787.5);
  assert.equal(result.low, 1430);
  assert.equal(result.high, 2145);
  assert.equal(formatUSD(result.estimate), '$1,788');
});

test('default inputs produce $1,250 with a $1,000–$1,500 range', () => {
  const result = calculateSponsorship(defaultInput);
  assert.equal(result.estimate, 1250);
  assert.equal(result.low, 1000);
  assert.equal(result.high, 1500);
});

test('short mention with smaller reach', () => {
  const result = calculateSponsorship({ ...defaultInput, views: 10000, cpm: 20, integration: 'mention' });
  assert.equal(result.estimate, 120);
  assert.equal(result.low, 96);
  assert.equal(result.high, 144);
});

test('dedicated video, paid usage and 90 days exclusivity', () => {
  const result = calculateSponsorship({ ...defaultInput, views: 100000, cpm: 40, integration: 'dedicated', usage: 'paid', exclusivity: '90-days', production: 500 });
  assert.equal(result.integratedFee, 6000);
  assert.equal(result.usageFee, 3000);
  assert.equal(result.exclusivityFee, 1800);
  assert.equal(result.estimate, 11300);
  assert.equal(result.low, 9040);
  assert.equal(result.high, 13560);
});

test('every integration, usage, and exclusivity combination applies to the same integrated base', () => {
  for (const integration of integrationOptions) {
    for (const usage of usageOptions) {
      for (const exclusivity of exclusivityOptions) {
        const result = calculateSponsorship({ ...defaultInput, integration: integration.value, usage: usage.value, exclusivity: exclusivity.value, production: 73 });
        const expected = 1250 * integration.multiplier * (1 + usage.uplift + exclusivity.uplift) + 73;
        assert.ok(Math.abs(result.estimate - expected) < 1e-9);
      }
    }
  }
});

test('zero views and zero CPM preserve only production cost', () => {
  for (const changes of [{ views: 0 }, { cpm: 0 }]) {
    const result = calculateSponsorship({ ...defaultInput, ...changes, usage: 'paid', exclusivity: '90-days', production: 100 });
    assert.equal(result.estimate, 100);
    assert.equal(result.low, 80);
    assert.equal(result.high, 120);
  }
  assert.equal(calculateSponsorship({ ...defaultInput, views: 0, cpm: 0 }).estimate, 0);
});

test('decimal money values are not rounded before the final display', () => {
  const result = calculateSponsorship({ ...defaultInput, views: 12345, cpm: 12.34, production: 99.99 });
  assert.ok(Math.abs(result.estimate - 252.3273) < 1e-9);
  assert.equal(formatUSD(result.estimate), '$252');
  assert.equal(formatUSD(result.low), '$202');
  assert.equal(formatUSD(result.high), '$303');
  assert.equal(numericError('0.29', 'cpm'), null);
  assert.equal(numericError('999999.99', 'production'), null);
});

test('empty, negative, nonfinite, fractional views, and out-of-range inputs are rejected', () => {
  for (const field of ['views', 'cpm', 'production']) {
    for (const raw of ['', ' ', '-1', 'NaN', 'Infinity', 'not a number']) {
      assert.ok(numericError(raw, field), `${field}: ${raw}`);
    }
    for (const value of [-1, NaN, Infinity, -Infinity]) {
      assert.throws(() => calculateSponsorship({ ...defaultInput, [field]: value }), RangeError);
    }
    assert.equal(numericError('0', field), null);
  }
  for (const [field, value] of [['views', 1.5], ['views', 1000000001], ['cpm', 10000.01], ['production', 1000000.01], ['cpm', 0.001], ['production', 12.345]]) {
    assert.throws(() => calculateSponsorship({ ...defaultInput, [field]: value }), RangeError);
  }
});

test('upper boundaries remain finite and allowed', () => {
  const result = calculateSponsorship({ views: 1_000_000_000, cpm: 10000, production: 1000000, integration: 'dedicated', usage: 'paid', exclusivity: '90-days' });
  assert.equal(result.estimate, 27001000000);
  assert.equal(result.low, 21600800000);
  assert.equal(result.high, 32401200000);
});

test('unknown option keys are rejected instead of silently using a default', () => {
  for (const field of ['integration', 'usage', 'exclusivity']) {
    assert.throws(() => calculateSponsorship({ ...defaultInput, [field]: 'unknown' }), RangeError);
  }
});

test('half-dollar estimates and ranges round up without binary floating-point drift', () => {
  const estimateCase = calculateSponsorship({ ...defaultInput, views: 702000, cpm: 3.34, production: 12.48, usage: 'paid' });
  assert.equal(estimateCase.estimate, 3529.5);
  assert.equal(formatUSD(estimateCase.rounded.estimate), '$3,530');
  assert.equal(formatUSD(estimateCase.rounded.low), '$2,824');
  assert.equal(formatUSD(estimateCase.rounded.high), '$4,235');

  const rangeCase = calculateSponsorship({ views: 385000, cpm: 74.61, production: 788.53, integration: 'dedicated', usage: 'paid', exclusivity: '90-days' });
  assert.equal(rangeCase.low, 62676.5);
  assert.equal(formatUSD(rangeCase.rounded.low), '$62,677');
});

test('large estimates just below, at, and above half a dollar round exactly', () => {
  // The first exact estimate is $20,222,729,777.49999975. Converting it to a
  // floating-point Number before rounding would incorrectly round it up.
  for (const [views, expected] of [[998654321, 20222729777], [998000000, 20209479791], [997345679, 20196229804]]) {
    const result = calculateSponsorship({ views, cpm: 9999.99, production: 0, integration: 'dedicated', usage: 'organic', exclusivity: '30-days' });
    assert.equal(result.rounded.estimate, expected);
  }
});
