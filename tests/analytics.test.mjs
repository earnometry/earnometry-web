import assert from 'node:assert/strict';
import test from 'node:test';
import { canonicalPagePath, createAnalytics, createCalculatorTracker } from '../src/lib/analytics.ts';

function setup() {
  const events = [];
  const state = { consent: 'granted', ready: true, broken: false };
  const analytics = createAnalytics({
    consent: () => { if (state.broken) throw Error('Storage unavailable'); return state.consent; },
    ready: () => state.ready,
    path: () => '/tools/youtube-money-calculator.html?utm_campaign=qa#private',
    tag: () => (...args) => events.push(args),
  });
  return { analytics, state, events };
}

test('custom events require explicit consent, a loaded tag and accessible storage', () => {
  const { analytics, state, events } = setup();
  for (const choice of [null, 'denied', 'invalid']) {
    state.consent = choice;
    assert.equal(analytics.send('calculator_started', { calculator_id: 'youtube_money' }), false);
  }
  state.consent = 'granted';
  state.ready = false;
  assert.equal(analytics.send('calculator_started', { calculator_id: 'youtube_money' }), false);
  state.ready = true;
  state.broken = true;
  assert.equal(analytics.send('calculator_started', { calculator_id: 'youtube_money' }), false);
  assert.deepEqual(events, []);
});

test('only allowlisted context is sent; raw input and query/fragment data are dropped', () => {
  const { analytics, events } = setup();
  assert.equal(analytics.send('calculator_result_generated', {
    calculator_id: 'youtube_money', rpm: 3, target: 1000, email: 'private@example.test', page_path: '/private',
  }), true);
  assert.deepEqual(events, [['event', 'calculator_result_generated', {
    event_version: '1', page_path: '/tools/youtube-money-calculator', calculator_id: 'youtube_money',
  }]]);
  assert.equal(canonicalPagePath('/guides/index.html?source=test#answer'), '/guides/');
});

test('unknown events, invalid calculators and mismatched link families are rejected', () => {
  const { analytics, events } = setup();
  assert.equal(analytics.send('raw_form', { calculator_id: 'youtube_money' }), false);
  assert.equal(analytics.send('calculator_started', { calculator_id: 'unknown' }), false);
  assert.equal(analytics.send('income_target_used', { calculator_id: 'sponsorship_rate' }), false);
  assert.equal(analytics.send('internal_cta_clicked', { cta_id: 'youtube_related_sponsorship' }), false);
  assert.equal(analytics.send('related_tool_clicked', { cta_id: 'home_youtube_hero' }), false);
  assert.equal(analytics.send('internal_cta_clicked', { cta_id: '__proto__' }), false);
  assert.deepEqual(events, []);
});

test('cross-tool and CTA events use fixed destination metadata and separate families', () => {
  const { analytics, events } = setup();
  analytics.send('related_tool_clicked', { cta_id: 'youtube_related_sponsorship', destination_path: '/private?rpm=3' });
  analytics.send('internal_cta_clicked', { cta_id: 'home_youtube_hero' });
  assert.equal(events.length, 2);
  assert.deepEqual(events[0].slice(0, 2), ['event', 'related_tool_clicked']);
  assert.equal(events[0][2].destination_path, '/tools/sponsorship-rate-calculator');
  assert.equal(events[0][2].destination_calculator_id, 'sponsorship_rate');
  assert.equal(events[1][1], 'internal_cta_clicked');
});

test('startup is silent; invalid edits start use, and the first valid zero result counts once', () => {
  const { analytics, events } = setup();
  const tracker = createCalculatorTracker('sponsorship_rate', analytics);
  assert.deepEqual(events, []);
  tracker.edit({ kind: 'revenue', resultReady: false });
  tracker.edit({ kind: 'revenue', resultReady: false });
  assert.deepEqual(events.map(e => e[1]), ['calculator_started']);
  tracker.edit({ kind: 'revenue', resultReady: true });
  tracker.edit({ kind: 'revenue', resultReady: true });
  assert.deepEqual(events.map(e => e[1]), ['calculator_started', 'calculator_result_generated']);
});

test('range/target-only edits never manufacture a central result; targets are independent', () => {
  const { analytics, events } = setup();
  const tracker = createCalculatorTracker('youtube_money', analytics);
  tracker.edit({ kind: 'range', resultReady: true, targetReady: true });
  assert.deepEqual(events.map(e => e[1]), ['calculator_started']);
  tracker.edit({ kind: 'target', resultReady: false, targetReady: false });
  tracker.edit({ kind: 'target', resultReady: false, targetReady: true });
  tracker.edit({ kind: 'target', resultReady: true, targetReady: true });
  assert.deepEqual(events.map(e => e[1]), ['calculator_started', 'income_target_used']);
});

test('a target entered before its RPM can qualify when a later RPM edit makes it ready', () => {
  const { analytics, events } = setup();
  const tracker = createCalculatorTracker('youtube_money', analytics);
  tracker.edit({ kind: 'target', resultReady: false, targetReady: false });
  tracker.edit({ kind: 'revenue', resultReady: false, targetReady: true });
  assert.deepEqual(events.map(e => e[1]), ['calculator_started', 'income_target_used']);
});

test('denied or unloaded-tag interactions are not queued or replayed on consent/readiness changes', () => {
  const { analytics, state, events } = setup();
  const tracker = createCalculatorTracker('youtube_money', analytics);
  state.consent = 'denied';
  tracker.edit({ kind: 'target', resultReady: true, targetReady: true });
  state.consent = 'granted';
  assert.deepEqual(events, []);
  tracker.edit({ kind: 'revenue', resultReady: true, targetReady: true });
  assert.deepEqual(events.map(e => e[1]), ['calculator_started', 'calculator_result_generated']);
  state.consent = 'denied';
  tracker.edit({ kind: 'target', resultReady: true, targetReady: true });
  state.consent = 'granted';
  tracker.edit({ kind: 'revenue', resultReady: true, targetReady: true });
  assert.equal(events.length, 2);
  state.ready = false;
  tracker.edit({ kind: 'target', resultReady: true, targetReady: true });
  state.ready = true;
  assert.equal(events.length, 2);
  tracker.edit({ kind: 'target', resultReady: true, targetReady: true });
  assert.equal(events.at(-1)[1], 'income_target_used');
});

test('missing/throwing tags fail safely without consuming a first-use event', () => {
  let tag;
  const calls = [];
  const analytics = createAnalytics({ consent: () => 'granted', ready: () => true, path: () => '/', tag: () => tag });
  const tracker = createCalculatorTracker('youtube_money', analytics);
  tracker.edit({ kind: 'revenue', resultReady: true });
  tag = () => { throw Error('Tag blocked'); };
  assert.doesNotThrow(() => tracker.edit({ kind: 'revenue', resultReady: true }));
  tag = (...args) => calls.push(args);
  tracker.edit({ kind: 'revenue', resultReady: true });
  assert.deepEqual(calls.map(e => e[1]), ['calculator_started', 'calculator_result_generated']);
});

test('each new calculator page has fresh deduplication state', () => {
  const { analytics, events } = setup();
  for (let page = 0; page < 2; page++) {
    const tracker = createCalculatorTracker('youtube_money', analytics);
    tracker.edit({ kind: 'revenue', resultReady: true });
  }
  assert.equal(events.filter(e => e[1] === 'calculator_started').length, 2);
  assert.equal(events.filter(e => e[1] === 'calculator_result_generated').length, 2);
});

test('navigation uses supported callback controls with a 200 ms bound and unchanged business context', () => {
  const { analytics, events } = setup();
  const complete = () => {};
  assert.equal(analytics.send('internal_cta_clicked', { cta_id: 'home_youtube_hero', rpm: 3 }, complete), true);
  assert.deepEqual(events[0][2], {
    event_version: '1', page_path: '/tools/youtube-money-calculator',
    placement: 'home_hero', destination_path: '/tools/youtube-money-calculator', cta_id: 'home_youtube_hero',
    event_callback: complete, event_timeout: 200,
  });
});
