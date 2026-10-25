# ANA-02 implementation and verification

- Date: 25 October 2026 (Europe/Madrid).
- Base: remote `main` at `cea165b97def96fecc35e4f8ae23fa0c742d7803`, synchronized by fast-forward.
- Branch: `codex/ana-02-product-measurement`.
- Contract: [PRODUCT_SPEC_v1.md](PRODUCT_SPEC_v1.md), sections 7-8 and 12; approved Strategy v1.1.
- Status: implemented and verified locally; production release authorized by the user on 25 October 2026. Deployment evidence and authenticated GA4 verification are recorded separately.
- New content production remains on hold. No new assets or topics were selected.

## Implemented behavior

YouTube Money Calculator is the primary home hero CTA, first tool card and first shared navigation link. Sponsorship is retained as a secondary tool, and the existing guide and all routes remain available. The homepage description and audience copy follow the YouTube-creator focus. This changes existing product navigation/copy; it does not produce a new content asset.

`src/lib/analytics.ts` owns the event vocabulary, fixed link context, consent/readiness checks and use deduplication. The calculators use their existing evaluators, with no arithmetic changes. Real input/change events with a changed field value trigger measurement. Focus/blur, initial examples, programmatic updates and passive `pageshow` restoration do not. Repeated native input/change notifications for the same value do not double count.

| Event | Implemented rule |
| --- | --- |
| `calculator_started` | First changed calculator field, including an invalid value, at most once per loaded calculator page |
| `calculator_result_generated` | First valid central result following an actual revenue/fee-input edit; zero counts; at most once per calculator page |
| `income_target_used` | Nonblank valid YouTube target with at least one ready format-only alternative; at most once per page. A target entered before its RPM can qualify on a subsequent RPM edit. A restored target without a user target interaction does not qualify. |
| `internal_cta_clicked` | One event per activation of an identified homepage or guide CTA |
| `related_tool_clicked` | One event per contextual calculator-to-calculator link activation, without a duplicate generic CTA event |

Range/target-only changes cannot manufacture a central-result event. Range/target errors remain independent of valid central revenue. Target events can occur even when current-view revenue is unavailable. Reload/full navigation creates a fresh document and fresh use counters; back/forward restoration of an existing document remains passive.

## Consent, transport and context

Custom events require the current in-memory choice and readable localStorage choice `earnometry-analytics-consent=granted`, successful loading of the existing Google-tag script, and an available `window.gtag` function. Loading the tag sets a readiness flag; it does not flush or replay previous interactions. Denied/absent consent, inaccessible storage, a blocked/unloaded tag or a missing/throwing function safely suppresses custom events. A failed consent write clears the in-memory permission, so a stale stored grant cannot override a new rejection or failed acceptance. Failed sends do not consume a first-use event. Changing consent affects subsequent interactions immediately.

The original GA4 configuration remains `G-4X5MF3R8PS`. Its script/config is not duplicated. Existing consent-mode defaults/updates remain, including denied advertising storage, user data and personalization. The Google tag itself still loads regardless of analytics choice; the new gate applies specifically to custom product events. Consent-update exceptions cannot prevent the banner from closing or the storage attempt.

Parameters are built from a fixed allowlist, not form data or link text:

| Parameter | Meaning |
| --- | --- |
| `event_version` | `1` |
| `page_path` | Current canonical path with no query/fragment or build-only `.html` suffix |
| `calculator_id` | `youtube_money` / `sponsorship_rate`, for use events and source of cross-tool links |
| `cta_id` | One of the 12 fixed identifiers below |
| `placement` | Fixed position from the registry |
| `destination_path` | Fixed internal route from the registry |
| `destination_calculator_id` | Target calculator for cross-tool links |

No raw views, RPM, CPM, targets, fee/result amounts, email/identity, free text or full URLs/query strings are added to custom-event parameters. Standard Google-tag acquisition behavior remains separate. Inbound UTMs are preserved; internal links add no UTMs. Custom result counts represent consented document-level use, not unique creators or total site visitors.

## CTA registry

| CTA ID | Placement | Destination | Event |
| --- | --- | --- | --- |
| `home_youtube_hero` | `home_hero` | `/tools/youtube-money-calculator` | `internal_cta_clicked` |
| `home_youtube_title` | `home_card` | `/tools/youtube-money-calculator` | `internal_cta_clicked` |
| `home_youtube_card` | `home_card` | `/tools/youtube-money-calculator` | `internal_cta_clicked` |
| `home_sponsorship_title` | `home_card` | `/tools/sponsorship-rate-calculator` | `internal_cta_clicked` |
| `home_sponsorship_card` | `home_card` | `/tools/sponsorship-rate-calculator` | `internal_cta_clicked` |
| `home_guide_title` | `home_card` | `/guides/how-many-youtube-views-to-make-1000` | `internal_cta_clicked` |
| `home_guide_card` | `home_card` | `/guides/how-many-youtube-views-to-make-1000` | `internal_cta_clicked` |
| `guide_youtube_quick_answer` | `guide_quick_answer` | `/tools/youtube-money-calculator` | `internal_cta_clicked` |
| `guide_youtube_inline` | `guide_body` | `/tools/youtube-money-calculator` | `internal_cta_clicked` |
| `guide_youtube_footer` | `guide_footer` | `/tools/youtube-money-calculator` | `internal_cta_clicked` |
| `youtube_related_sponsorship` | `related_tool` | `/tools/sponsorship-rate-calculator` | `related_tool_clicked` |
| `sponsorship_related_youtube` | `related_tool` | `/tools/youtube-money-calculator` | `related_tool_clicked` |

Both primary clicks and middle-button activations are supported; native keyboard Enter activation uses the click handler. Default-prevented links are ignored. Navigation is not delayed or canceled by analytics. Brand/navigation/back links, table-of-contents anchors, methodology links, consent buttons and external source links are not tagged conversion CTAs.

## Verification performed

1. Node v24.19.0: **52 tests passed**, 0 failed/skipped. `tests/analytics.test.mjs` adds 10 behavior tests covering consent/readiness/storage failures, payload allowlisting, wrong event families, per-document deduplication, independent targets, no replay and missing/throwing tags. All 42 existing math/validation tests remain unchanged and pass.
2. Astro check: **0 errors, 0 warnings, 0 hints** across 15 files. The run used `ASTRO_TELEMETRY_DISABLED=1` to avoid writing telemetry configuration outside the workspace.
3. Production build: successful, six HTML outputs including 404, five canonical sitemap entries. No package or lockfile changes and no new runtime dependencies.
4. Chrome 155 automated QA against the built `dist/` output served temporarily on localhost: **12 scenario groups passed**. Tests intercepted the existing Google script with a local stub or deliberately blocked it; all other external requests were blocked. No QA event was sent to the production property.

Browser coverage: consent absent/granted/revoked/regranted without replay; failed writes with a stale stored grant; blank/invalid/zero/repeated calculator edits; valid target independent of views; target before RPM; ranges/targets not creating central-result events; passive restoration and synthetic changes; sponsorship defaults/validation/select edits; blocked/missing/throwing tag and unavailable storage; all 12 CTAs including keyboard navigation; no-JavaScript fallback; all five public routes at widths 320, 390, 768 and 1280 with no document overflow; home hierarchy; a single Google tag; canonicals, Article JSON-LD, five-entry sitemap and custom noindex 404. Mobile homepage and calculator screenshots were visually inspected.

These are implementation and controlled browser results, not new performance measurements. The original migration ZIP/trackers remain unchanged; their 24 October evidence stays historical. The local operating workspace holds the unchanged approved `EARNOMETRY_STRATEGY.md` and a current `EARNOMETRY_STATE.json` revision. Those operating files and the migration ZIP are excluded from the public application release. The local state records MIG-01/GitHub verification, completed SPEC-01, local ANA-02 checks, the production hold and the remaining real-GA4 step; unchanged performance evidence remains dated 24 October.

## Pending release and real GA4 verification

ANA-02 is not fully closed until the following evidence exists:

1. Production release was authorized by the user on 25 October 2026. Merge the reviewed branch through the existing main/GitHub Pages workflow and record the resulting commit and successful deployment run.
2. With authorized access to the correct GA4 property/web stream, record a controlled production QA window (date, time, route and consent state). Verify all five events and their allowed parameters in Realtime/DebugView. Do not infer delivery from a JavaScript call or a successful HTTP/build check.
3. Keep those QA interactions separate from performance baselines. Confirm the one-result-per-consented-document interpretation before reporting starts/results.
4. Verify/create only the required property-side custom dimensions and consider `calculator_result_generated` as the first key event under the approved measurement plan. No such property settings have been changed or claimed verified here.
5. Record deployment commit/run, GA4 observations and any remaining limitations in the current state/trackers. Only then mark the measurement baseline verified and advance to AUTO-02. Content production remains paused through Operator setup and DISC-01.

Official implementation references: [Google tag events](https://developers.google.com/analytics/devguides/collection/ga4/events) and [consent default/update commands](https://developers.google.com/tag-platform/security/guides/consent).

The Spanish walkthrough for the property owner is [GA4_VERIFICATION.md](GA4_VERIFICATION.md). Actual property-side receipt remains pending until the owner confirms the five events and relevant parameters.
