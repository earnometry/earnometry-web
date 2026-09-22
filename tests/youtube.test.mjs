import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyYouTubeInput, evaluateYouTube, formatRevenue, formatRpm, formatViews, parseYouTubeNumber } from '../src/lib/youtube.ts';

const evaluate = (changes = {}) => evaluateYouTube({ ...emptyYouTubeInput(), longViews: '100000', longRpm: '3', ...changes });
const combined = { shortsViews: '1000000', shortsRpm: '0.05' };
const money = (state, key) => formatRevenue(state.revenue[key]);

for (const [name, inputs, monthly, daily, annual] of [
  ['long-form only', {}, '$300.00', '$9.86', '$3,600.00'],
  ['Shorts only with blank long-form RPM', { longViews: '0', longRpm: '', ...combined }, '$50.00', '$1.64', '$600.00'],
  ['combined formats', combined, '$350.00', '$11.51', '$4,200.00'],
  ['zero views and blank RPMs', { longViews: '0', longRpm: '', shortsViews: '0' }, '$0.00', '$0.00', '$0.00'],
  ['zero RPMs with positive views', { longRpm: '0', shortsViews: '123456', shortsRpm: '0' }, '$0.00', '$0.00', '$0.00'],
  ['four-decimal Shorts RPM', { longViews: '0', longRpm: '', shortsViews: '1000000', shortsRpm: '0.0001' }, '$0.10', '<$0.01', '$1.20'],
  ['upper limits', { longViews: '1000000000', longRpm: '10000', shortsViews: '1000000000', shortsRpm: '10000' }, '$20,000,000,000.00', '$657,534,246.58', '$240,000,000,000.00'],
]) {
  test(`YouTube revenue: ${name}`, () => {
    const state = evaluate(inputs);
    assert.deepEqual(state.errors, {});
    assert.equal(money(state, 'monthly'), monthly);
    assert.equal(money(state, 'daily'), daily);
    assert.equal(money(state, 'annual'), annual);
  });
}

test('combined revenue preserves separate format contributions and unrounded units', () => {
  const state = evaluate(combined);
  assert.equal(money(state, 'longForm'), '$300.00');
  assert.equal(money(state, 'shorts'), '$50.00');
  assert.deepEqual(state.revenue.monthly, { numerator: 3_500_000_000n, denominator: 10_000_000n });
  assert.equal(state.revenue.daily.numerator, state.revenue.annual.numerator);
  assert.equal(state.revenue.daily.denominator, state.revenue.annual.denominator * 365n);
});

test('blank initial state and required/optional blank input rules', () => {
  const initial = evaluateYouTube(emptyYouTubeInput());
  assert.equal(initial.revenue, null);
  assert.ok(initial.errors.longViews);
  assert.equal(initial.range, null);
  assert.equal(initial.targets.long.status, 'empty');
  for (const blank of ['', ' ', '\t\n']) {
    assert.equal(evaluate({ longViews: blank }).revenue, null);
    assert.equal(evaluate({ longRpm: blank }).revenue, null);
    assert.equal(money(evaluate({ shortsViews: blank }), 'monthly'), '$300.00');
    assert.equal(evaluate({ shortsViews: '1', shortsRpm: blank }).revenue, null);
    assert.equal(money(evaluate({ longViews: '0', longRpm: blank }), 'monthly'), '$0.00');
  }
});

for (const [views, longExpected, shortsExpected] of [
  ['10000', '$30.00', '$0.50'], ['100000', '$300.00', '$5.00'], ['1000000', '$3,000.00', '$50.00'],
]) {
  test(`hypothetical ${views}-view educational examples`, () => {
    assert.equal(money(evaluate({ longViews: views }), 'monthly'), longExpected);
    assert.equal(money(evaluate({ longViews: '0', longRpm: '', shortsViews: views, shortsRpm: '0.05' }), 'monthly'), shortsExpected);
  });
}

test('low/high ranges vary RPM only and hold omitted pairs at their central RPM', () => {
  const both = evaluate({ ...combined, longLow: '2', longHigh: '4', shortsLow: '0.02', shortsHigh: '0.08' });
  assert.equal(formatRevenue(both.range.low), '$220.00');
  assert.equal(formatRevenue(both.range.high), '$480.00');
  const one = evaluate({ ...combined, longLow: '2', longHigh: '4' });
  assert.equal(formatRevenue(one.range.low), '$250.00');
  assert.equal(formatRevenue(one.range.high), '$450.00');
  assert.deepEqual(one.range.shorts, { low: 500n, high: 500n });
  const shortsRange = evaluate({ ...combined, shortsLow: '0', shortsHigh: '0.1' });
  assert.equal(formatRevenue(shortsRange.range.low), '$300.00');
  assert.equal(formatRevenue(shortsRange.range.high), '$400.00');
  assert.equal(evaluate(combined).range, null);
});

test('range equality, zero bounds, and inactive formats are handled explicitly', () => {
  const equal = evaluate({ longLow: '3', longHigh: '3' });
  assert.equal(formatRevenue(equal.range.low), '$300.00');
  assert.equal(formatRevenue(equal.range.high), '$300.00');
  const zero = evaluate({ longRpm: '0', longLow: '0', longHigh: '0' });
  assert.equal(formatRevenue(zero.range.high), '$0.00');
  const inactive = evaluate({ shortsViews: '0', shortsLow: '-1', shortsHigh: 'bad', longLow: '2', longHigh: '4' });
  assert.equal(formatRevenue(inactive.range.low), '$200.00');
  assert.deepEqual(inactive.errors, {});
  assert.equal(inactive.range.shorts, null);
  assert.equal(evaluate({ longViews: '0', longLow: '2', longHigh: '4' }).range, null);
});

for (const [low, high] of [['2', ''], ['', '4'], ['4', '2'], ['4', '5'], ['1', '2'], ['-1', '4'], ['2', '10000.0001'], ['abc', '4']]) {
  test(`invalid range ${low}/${high} does not hide valid revenue or targets`, () => {
    const state = evaluate({ longLow: low, longHigh: high, target: '1000' });
    assert.equal(state.range, null);
    assert.ok(state.errors.longLow || state.errors.longHigh);
    assert.equal(money(state, 'monthly'), '$300.00');
    assert.deepEqual(state.targets.long, { status: 'ready', views: 333334n });
  });
}

for (const kind of ['views', 'rpm', 'target']) {
  test(`${kind} rejects invalid and negative values, including negative underflow`, () => {
    for (const raw of ['NaN', 'Infinity', '-Infinity', '1e309', 'abc', '1,000', '$3', '0x10', '.', '+', '-1', '-0.01', '-1e-999']) {
      assert.ok(parseYouTubeNumber(raw, kind).error, `${kind}: ${raw}`);
    }
    assert.equal(parseYouTubeNumber('0', kind).error, null);
    assert.equal(parseYouTubeNumber('-0', kind).value, 0n);
  });
}

test('exact decimal validation accepts boundaries and scientific notation without losing precision', () => {
  for (const [kind, raw, scaled] of [
    ['views', '1000000000', 1000000000n], ['rpm', '10000', 100000000n], ['target', '1000000', 100000000n],
    ['rpm', '0.0001', 1n], ['target', '999999.99', 99999999n], ['views', '1e9', 1000000000n],
    ['rpm', '1e-4', 1n], ['rpm', '3.00000', 30000n], ['views', ' 12 ', 12n], ['rpm', '.05', 500n],
  ]) assert.deepEqual(parseYouTubeNumber(raw, kind), { value: scaled, error: null });
  for (const [kind, raw] of [
    ['views', '1000000001'], ['rpm', '10000.0001'], ['target', '1000000.01'],
    ['views', '1.5'], ['views', '1.00000000000000001'], ['rpm', '0.00001'], ['rpm', '3.0000000000000001'],
    ['target', '1.001'], ['rpm', '1e-999'], ['views', '1e10'], ['rpm', '10000.00000000001'],
  ]) assert.ok(parseYouTubeNumber(raw, kind).error, `${kind}: ${raw}`);
});

test('validation follows dependencies; invalid required revenue never becomes a partial total', () => {
  for (const [key, value] of [['longViews', '-1'], ['shortsViews', 'bad'], ['longRpm', '-1'], ['shortsRpm', 'Infinity']]) {
    const state = evaluate({ ...combined, [key]: value, target: '1000' });
    assert.equal(state.revenue, null);
    assert.ok(state.errors[key]);
  }
  assert.equal(evaluate({ longViews: '0', longRpm: '-1' }).revenue, null);
  const badTarget = evaluate({ target: '-1', longLow: '2', longHigh: '4' });
  assert.equal(money(badTarget, 'monthly'), '$300.00');
  assert.ok(badTarget.range);
  assert.equal(badTarget.targets.long.status, 'invalid');
  const noViews = evaluate({ longViews: '', shortsViews: '-1', target: '1000', shortsRpm: '0.05' });
  assert.equal(noViews.revenue, null);
  assert.deepEqual(noViews.targets.long, { status: 'ready', views: 333334n });
  assert.deepEqual(noViews.targets.shorts, { status: 'ready', views: 20000000n });
  assert.equal(money(evaluate(), 'monthly'), '$300.00', 'correcting inputs restores results');
});

test('targets are independent alternatives with explicit blank, zero, invalid, and unreachable states', () => {
  const state = evaluate({ ...combined, target: '1000' });
  assert.deepEqual(state.targets.long, { status: 'ready', views: 333334n });
  assert.deepEqual(state.targets.shorts, { status: 'ready', views: 20000000n });
  assert.equal(evaluate().targets.long.status, 'empty');
  assert.equal(evaluate({ target: '1000', shortsRpm: '' }).targets.shorts.status, 'empty');
  assert.equal(evaluate({ target: '1000', longRpm: '0' }).targets.long.status, 'unreachable');
  for (const rpm of ['', '0']) {
    const zero = evaluate({ target: '0', longRpm: rpm, shortsRpm: rpm });
    assert.deepEqual(zero.targets.long, { status: 'ready', views: 0n });
    assert.deepEqual(zero.targets.shorts, { status: 'ready', views: 0n });
  }
  const invalid = evaluate({ target: '0', longRpm: '-1', shortsRpm: '0' });
  assert.equal(invalid.targets.long.status, 'invalid');
  assert.deepEqual(invalid.targets.shorts, { status: 'ready', views: 0n });
});

test('required views round upward exactly and remain uncapped beyond input limits', () => {
  assert.equal(evaluate({ target: '1000000', longRpm: '0.0001' }).targets.long.views, 10000000000000n);
  assert.equal(formatViews(10000000000000n), '10,000,000,000,000');
  for (const target of ['0.01', '1', '99.99', '1000', '1000000']) {
    for (const rpm of ['0.0001', '0.05', '3', '3.1415', '10000']) {
      const result = evaluate({ target, longRpm: rpm }).targets.long;
      const targetCents = parseYouTubeNumber(target, 'target').value;
      const rpmUnits = parseYouTubeNumber(rpm, 'rpm').value;
      assert.equal(result.status, 'ready');
      assert.ok(result.views * rpmUnits >= targetCents * 100000n);
      assert.ok((result.views - 1n) * rpmUnits < targetCents * 100000n);
    }
  }
  assert.equal(evaluate({ target: '300', longRpm: '3' }).targets.long.views, 100000n);
});

test('cent rounding is exact and annual/daily values never use a rounded monthly amount', () => {
  const below = evaluate({ longViews: '99', longRpm: '0.05' });
  const half = evaluate({ longViews: '100', longRpm: '0.05' });
  const above = evaluate({ longViews: '101', longRpm: '0.05' });
  assert.equal(money(below, 'monthly'), '<$0.01');
  assert.equal(money(half, 'monthly'), '$0.01');
  assert.equal(money(above, 'monthly'), '$0.01');
  assert.equal(money(half, 'annual'), '$0.06');
  assert.deepEqual(half.revenue.monthly, { numerator: 50000n, denominator: 10000000n });
  assert.equal(money(half, 'daily'), '<$0.01');
  const sumBeforeRounding = evaluate({ longViews: '99', longRpm: '0.05', shortsViews: '99', shortsRpm: '0.05' });
  assert.equal(money(sumBeforeRounding, 'monthly'), '$0.01');
  assert.equal(money(sumBeforeRounding, 'annual'), '$0.12');
  for (const [numerator, expected] of [[18249999n, '<$0.01'], [18250000n, '$0.01'], [18250001n, '$0.01']]) {
    assert.equal(formatRevenue({ numerator, denominator: 3650000000n }), expected);
  }
  for (const [numerator, expected] of [[19999999999049999n, '$1,999,999,999.90'], [19999999999050000n, '$1,999,999,999.91'], [19999999999050001n, '$1,999,999,999.91']]) {
    assert.equal(formatRevenue({ numerator, denominator: 10000000n }), expected);
  }
  assert.equal(formatRpm(1n), '$0.0001');
  assert.equal(formatRpm(30000n), '$3.00');
});
