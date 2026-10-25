# Earnometry Product Specification v1

- **Version:** 1.2 (ANA-02 deployment and link-delivery follow-up)
- **Audit date:** 25 October 2026 (Europe/Madrid)
- **Initiative:** SPEC-01
- **Status:** Sections 3-11 preserve the SPEC-01 baseline at the pinned remote commit. ANA-02 has an initial successful production release and the link-delivery follow-up described in sections 12-13. Authenticated GA4 receipt verification remains pending.
- **Strategic authority:** Approved Earnometry Strategy v1.1, 24 October 2026.
- **Production hold:** No new articles, tools, videos, Shorts, social posts, or demand-selected assets are authorized by this specification task.

## 1. Authority, provenance and scope

This document records the actual website and its approved next requirements. Sections marked **Implemented** describe inspected source and deployed HTML. Sections marked **Required / pending** define future work; they are not claims that the work is live.

Decision precedence is: current user instructions, approved Strategy v1.1, `EARNOMETRY_STATE.json`, latest Content and Analytics trackers, then this implementation contract. Repository code and deployment evidence establish what is implemented; Strategy establishes what should change. A strategic requirement does not become an implemented feature simply by appearing here.

The migration baseline is `EARNOMETRY_MIGRATION_PACKAGE_2026-10-24.zip`, SHA-256 `f0939378ea167f67ca340d9ea2aa3711fe7d3384c915b5b55fd0e816c29be7ef`. Its `earnometry_migration_package/` directory contains:

- `EARNOMETRY_STRATEGY.md`, whose internal version is 1.1. References elsewhere to `EARNOMETRY_STRATEGY_v1.1.md` refer to this supplied strategy; the archive has no separate file under that name.
- `EARNOMETRY_STATE.json`, schema 1.0, as of 24 October 2026.
- `Earnometry_Content_Tracker_2026-10-24_v4.0.xlsx`, especially Dashboard, Roadmap and Automation Strategy.
- `Earnometry_Analytics_Tracker_2026-10-24_v3.4.xlsx`, especially Evidence Framework and Website.

`PRODUCT_SPEC.md`, `CODEX_TASK_01.md`, their migration-package legacy copies, and `PRODUCT_SPEC_02.md` are historical implementation context. They cannot override Strategy v1.1 or this current contract. The README also contains stale claims identified below. This task does not rewrite those files or the frozen migration trackers/state.

### Audited repository revision

| Item | Verified value |
| --- | --- |
| Repository | [earnometry/earnometry-web](https://github.com/earnometry/earnometry-web) |
| Authoritative source | Remote `main`, commit [`cea165b97def96fecc35e4f8ae23fa0c742d7803`](https://github.com/earnometry/earnometry-web/tree/cea165b97def96fecc35e4f8ae23fa0c742d7803) |
| Commit date | 18 October 2026, 18:55:59 UTC |
| Deployment | [GitHub Pages run 39156441510](https://github.com/earnometry/earnometry-web/actions/runs/39156441510), successful, same commit, triggered by push |
| Public origin | `https://earnometry.com` |
| Local checkout at audit | `codex/youtube-money-calculator`, `9b34090fba285f55f7de7ec6373dc3df3adcd708`; older than remote main |

Remote files were read at the pinned commit. Public HTML, sitemap, robots and HTTP status checks were fetched directly on the audit date. The older local branch was not used as the current product baseline and was not switched or reset. Before ANA-02 implementation, synchronize from the current remote main and recheck for changes since the audited commit; do not apply the work directly to the obsolete local baseline.

## 2. Product purpose and strategic constraints

Earnometry provides free, evergreen calculators and practical guides about creator economics. For the approved 90-day focus, the primary audience is English-speaking YouTube creators working through earnings, RPM, view targets and sponsorship pricing. The initial commercial emphasis is the United States where useful. The public product language is English; calculator monetary inputs and results are USD.

The long-term business objective is more than approximately EUR 2,000/month with no more than approximately two hours of stable manual work per week. This is an objective, not observed revenue or a product earnings promise.

Preserve these constraints:

- Static-first, inexpensive, low-maintenance architecture; useful answers and transparent assumptions before promotion.
- Demand before format. No automatic VID-07, mandatory Long + Short pair, or new topic selected by this document.
- Website/SEO and YouTube remain core acquisition channels. X stays in low-effort maintenance mode.
- Measure actual calculator use before scaling production. Keep Exploratory, Directional and Actionable evidence distinct.
- Monetization remains unvalidated. Affiliate opportunities, low-maintenance digital products and later display ads require demand and unit economics before implementation.

## 3. Implemented pages and navigation

All five public pages below returned HTTP 200 at their clean, extensionless URL. A deliberately missing path returned the custom HTTP 404 page.

| Route | Implemented role | Source |
| --- | --- | --- |
| `/` | Brand introduction, sponsorship-first hero, cards for both calculators and the published guide | `src/pages/index.astro` |
| `/tools/youtube-money-calculator` | Long-form/Shorts revenue, RPM planning range and reverse income-target calculation, methodology and hypothetical examples | `src/pages/tools/youtube-money-calculator.astro` |
| `/tools/sponsorship-rate-calculator` | Sponsorship fee and indicative range with deal-term breakdown | `src/pages/tools/sponsorship-rate-calculator.astro` |
| `/guides` | Guide directory containing one guide | `src/pages/guides/index.astro` |
| `/guides/how-many-youtube-views-to-make-1000` | Published ART-01 guide, arithmetic examples, FAQ and calculator CTAs | `src/pages/guides/how-many-youtube-views-to-make-1000.astro` |
| Missing route / `404.html` | Shared layout, noindex, return-home link | `src/pages/404.astro` |

The shared header currently links only to the Sponsorship calculator. The home hero also links to that calculator, whose card precedes the YouTube tool. Home audience copy still mentions creators, solopreneurs and online businesses. These are current facts, not the desired 90-day priority.

The guide links to the YouTube calculator in its quick answer, explanatory copy and concluding CTA. The two calculators link contextually to each other, with an explicit instruction to avoid double-counting sponsorship and YouTube income. The calculator pages do not currently link back to the published guide. No account, signup or checkout journey exists.

## 4. Implemented architecture and deployment

| Area | Implementation |
| --- | --- |
| Framework | Astro `7.3.3`, static output, no server adapter or client UI framework |
| Toolchain | Node `>=24.0.0`; `.node-version` is `24`; TypeScript `6.0.3`; `@astrojs/check` `0.9.10`; `@astrojs/sitemap` `3.7.4` |
| Rendering | Astro generates static HTML; component scripts run calculations in the browser |
| Calculation logic | Pure TypeScript in `src/lib/youtube.ts` and `src/lib/sponsorship.ts` |
| UI | Astro components, plain responsive CSS, system fonts and local SVG favicon/brand mark |
| Shared shell | `src/layouts/BaseLayout.astro`: navigation, metadata, consent UI, GA4, footer |
| URLs | `site: 'https://earnometry.com'`, `trailingSlash: 'never'`, `build.format: 'file'` |
| Type checking | `astro/tsconfigs/strictest`, `allowImportingTsExtensions: true` |
| Data/services | No repository backend, database, authentication, payments, input-storage service or calculator API |
| Analytics service | Browser-loaded Google tag; details in section 8 |

The package scripts are `npm run dev`, `npm run check`, `npm test`, `npm run build` and `npm run preview`. The test script uses Node's built-in runner and native TypeScript support. `npm ci` is the clean, lockfile-based installation path. Build output is `dist/`.

**Deployment is GitHub Pages via GitHub Actions**, not Cloudflare Pages and not branch-based Jekyll publishing. `.github/workflows/deploy.yml` runs on pushes to `main` and manual dispatch. It uses `actions/checkout@v5`, `withastro/action@v5`, then `actions/deploy-pages@v4` in the `github-pages` environment. Workflow permissions are contents read, pages write and id-token write. The workflow does not explicitly run the standalone unit-test or Astro-check scripts.

The root `CNAME` contains `earnometry.com`. HTTPS pages were reachable during the audit. DNS configuration, GitHub Pages account settings and certificate controls were not modified or independently audited.

## 5. YouTube Money Calculator: implemented contract

Source: `YouTubeCalculator.astro`, `src/lib/youtube.ts` and `tests/youtube.test.mjs`.

### Inputs and states

| Input | Validation / behavior |
| --- | --- |
| `longViews` | Required, integer 0 through 1,000,000,000; explicitly enter 0 for Shorts only |
| `shortsViews` | Optional; blank means 0; same integer range |
| `longRpm`, `shortsRpm` | USD 0 through 10,000, at most four decimal places; required when the corresponding view count is positive |
| `longLow`, `longHigh`, `shortsLow`, `shortsHigh` | Optional low/high RPM pairs; controls disabled for a format without positive views |
| `target` | Optional monthly USD target, 0 through 1,000,000, at most two decimal places |

The form starts blank and supplies no central RPM default. Malformed, negative, nonfinite, over-limit or excessive-precision values are invalid. The library supports valid scientific notation without using floating-point conversion to erase decimal precision; browser numeric-input validity is also checked. A supplied invalid RPM can invalidate revenue even if its format has zero views.

Results update on input/change/focusout. Errors are displayed for touched fields, with `aria-invalid` and associated messages. Revenue, planning range and income-target alternatives have independent validity: a range or target error must not hide a valid central revenue result. Browser-restored values are recalculated on `pageshow`.

### Calculation and precision

```text
long-form monthly revenue = longViews / 1,000 * longRpm
Shorts monthly revenue = shortsViews / 1,000 * shortsRpm
monthly = long-form revenue + Shorts revenue
annual = monthly * 12
daily average = annual / 365
format-only target views = ceiling(target * 1,000 / that format's RPM)
```

Views and RPM must share the same format, period, revenue scope and view definition. The product explains that YouTube Studio Shorts RPM needs matching engaged views. RPM is already after platform revenue sharing; the calculator neither converts CPM nor subtracts platform share again. It adds no separate sponsorship income.

For a supplied range, each complete low/high pair must enclose its central RPM. A blank pair holds that active format at its central RPM; inactive formats contribute zero. At least one supplied, valid active pair is required to show a range. Views remain fixed. The range is an assumption scenario, not a statistical confidence interval.

Target results are separate alternatives: all long-form OR all Shorts, each covering the entire target. They are neither additional views nor a mixed strategy. Blank target shows guidance; zero target needs zero views; a positive target at zero RPM is unreachable. A target can be calculated from its RPM without a valid current-views revenue scenario. Required views above the input limit are displayed uncapped with an explanatory label.

The implementation uses scaled `bigint` values and exact fractions. Revenue rounds half up to cents only for display; a positive amount rounding to zero displays `<$0.01`. Daily/annual values derive from unrounded revenue. Components may differ from the rounded total by a cent.

Regression examples: 100,000 long-form views at $3 RPM gives $300.00/month; 1,000,000 Shorts views at $0.05 RPM gives $50.00/month. Combined: $350.00/month, $11.51/day and $4,200.00/year. With $2-$4 and $0.02-$0.08 bounds the monthly range is $220.00-$480.00. A $1,000 target needs 333,334 long-form views OR 20,000,000 Shorts views at the central RPMs. All RPM examples are hypothetical, not benchmarks.

With JavaScript unavailable, controls remain disabled, no live result is shown, and methodology/examples remain readable.

## 6. Sponsorship Rate Calculator: implemented contract

Source: `SponsorshipCalculator.astro`, `src/lib/sponsorship.ts` and `tests/sponsorship.test.mjs`.

Defaults are 50,000 views, $25 CPM, integrated segment, no usage rights, no exclusivity and $0 production. These are editable example assumptions, not market rates.

| Input | Allowed values |
| --- | --- |
| Views | Required integer 0 through 1,000,000,000 |
| CPM | Required USD 0 through 10,000, at most two decimal places |
| Production cost | Required USD 0 through 1,000,000, at most two decimal places |
| Integration | Short mention x0.60; integrated segment x1.00; dedicated video x1.50 |
| Usage rights | None +0%; organic brand reuse +20%; paid advertising usage +50% |
| Exclusivity | None +0%; 30 days +15%; 90 days +30% |

```text
base = views / 1,000 * CPM
integrated = base * integration multiplier
estimate = integrated * (1 + usage uplift + exclusivity uplift) + production
indicative range = estimate * 0.80 through estimate * 1.20
```

Usage/exclusivity uplifts are additive on the integrated fee; production is added last. Exact integer arithmetic preserves fractions before whole-dollar half-up display rounding. The +/-20% range is illustrative. Components may differ from the rounded total by a dollar. Zero views or zero CPM leave only production cost; unknown option values are rejected.

Regression examples: defaults give $1,250 with a $1,000-$1,500 range. Adding organic reuse, 30-day exclusivity and $100 production gives $1,787.50 unrounded, displayed as $1,788, with a $1,430-$2,145 range.

Invalid required fields clear the headline estimate/range and hide the breakdown. Valid edits update immediately. Results are recomputed on `pageshow`. Without JavaScript, disabled inputs and a notice identify the server-rendered default result as a static example. That passive example is not evidence of product use.

## 7. Required / pending: homepage priority and internal journeys

ANA-02 must make the YouTube Money Calculator the primary home hero CTA and first featured tool, while retaining Sponsorship as a secondary adjacent tool and preserving the guide. Align the home description/lead with the approved YouTube-creator focus. Keep the brand capable of later expansion; do not add unrelated audiences, new pages or new assets.

Shared navigation must make the YouTube calculator directly discoverable and retain access to Sponsorship. Preserve existing URLs, guide-to-calculator CTAs and the two contextual cross-tool links. Track conversion-oriented CTAs as specified below. This is pending alignment, not implemented behavior at the audited commit.

## 8. Measurement: existing implementation and ANA-02 contract

### Implemented GA4 and consent

`BaseLayout.astro` initializes `window.dataLayer`/`gtag`, uses measurement ID `G-4X5MF3R8PS`, and loads `https://www.googletagmanager.com/gtag/js?id=G-4X5MF3R8PS` asynchronously. The tag is loaded regardless of the stored analytics choice; this is not a promise of zero network requests before consent.

`analytics_storage` defaults to denied unless localStorage key `earnometry-analytics-consent` is `granted`. `ad_storage`, `ad_user_data` and `ad_personalization` remain denied. The initial consent command uses `wait_for_update: 500`. Accept/reject updates consent, saves `granted`/`denied` where storage is available, and hides the banner. The footer's Cookie settings button reopens the choice. Storage failures are caught. Calculator inputs themselves are not sent or saved by the calculator code.

There are **no explicit custom product-use events** in the audited source. Standard Google-tag behavior and the migration tracker's acquisition reports do not establish calculator use. GA4 property-side enhanced-measurement settings, custom dimensions, key events, DebugView delivery and reporting configuration were not accessible/verified in this audit. Search Console indexing claims remain historical tracker evidence, not a fresh Search Console inspection.

### Required / pending event definitions

The five names and product-use priority come from Strategy v1.1. The lifecycle/parameter rules below are the implementation contract for ANA-02. None is implemented by SPEC-01.

| Event | Exact meaning | Counting rule |
| --- | --- | --- |
| `calculator_started` | First actual user input/change to a calculator field; initial validation may be invalid | At most once per calculator per page lifecycle |
| `calculator_result_generated` | First valid central revenue/fee result rendered after the user changes a revenue/fee input; zero is a valid result | At most once per calculator per page lifecycle; primary meaningful product-use event |
| `income_target_used` | User supplies/changes a nonblank, valid YouTube target and at least one format-only target result is ready | At most once per YouTube calculator per page lifecycle; zero target is valid; invalid/unreachable-only results do not qualify |
| `internal_cta_clicked` | Activation of an explicitly identified home hero/card or guide-to-tool CTA | Once per actual activation; exclude cross-tool links covered by the next event |
| `related_tool_clicked` | Activation of a contextual link from one calculator page to the other calculator | Once per actual activation, without also sending `internal_cta_clicked` |

Page lifecycle means one loaded document; full navigation/reload creates a new lifecycle. Do not count initialization, server-rendered examples, mere focus/blur, passive browser restoration, automated recalculation or duplicate input/change handlers as additional uses. Range-only or target-only edits must not create a central-result event from an untouched default/restored result. Valid target use can exist independently of current-view revenue validity. Do not log each keystroke or each result update as another result.

Implement a shared, consent-aware event helper and use the existing evaluators for validity. Emit custom events only while analytics consent is explicitly granted; do not queue or replay interactions performed before consent. Deduplication is in page memory and applies to emitted events. Consent changes must be reflected during the same page lifecycle. Missing/blocked GA4, denied consent or unavailable storage must never break calculations, links or consent controls. Reuse the existing tag; do not introduce a second GA4 configuration or duplicate page views.

Allowed context is a small, fixed vocabulary: `event_version` (initially `1`), canonical `page_path` without query/fragment, `calculator_id` (`youtube_money` or `sponsorship_rate`) when applicable, and stable `cta_id`, `placement`, `destination_path`/`destination_calculator_id` for relevant links. Do not include raw views, RPM, CPM, income targets, result amounts, form values, personal identifiers, free text or full query strings in custom events. Preserve inbound UTMs for existing acquisition attribution, but do not add UTMs to internal links. Final CTA IDs must be listed in the ANA-02 implementation notes.

Treat `calculator_result_generated` as the first key-event candidate. Property-side setup and actual delivery must be verified separately; a source-code call is not reporting proof. Result counts measure consented page-level use, not unique creators, sessions, incremental revenue or all visitors. Compare starts/results only within compatible consented populations and reporting windows. Do not create optimization targets from the current tiny samples.

### ANA-02 acceptance evidence

Before marking ANA-02 complete, record:

1. Home hero/first tool and navigation lead to YouTube; existing tools and guide remain accessible.
2. Both calculators retain the mathematical, validation, no-JavaScript and history-restoration behavior in sections 5-6; existing calculation tests pass.
3. Granted-consent browser checks show one start, one first valid central result, valid target use and each appropriate link event, with only the allowed parameters. Cover blank/invalid/zero cases, defaults, repeated edits, range/target independence, keyboard activation and navigation.
4. Repeated handlers and passive startup/restoration do not generate extra use events. Denied/absent consent and blocked/missing tag produce no custom-event calls and no product errors. Accepting consent does not replay earlier activity; changing consent mid-page affects subsequent activity.
5. Relevant events arrive in the intended GA4 property through DebugView/Realtime using controlled QA traffic. Document timestamps/paths and keep QA separate from performance evidence. Verify any custom-dimension/key-event settings actually made; if property access is unavailable, report verification as pending rather than claiming completion.
6. Astro check/build and relevant browser/SEO regression checks pass on the synchronized implementation branch. Preserve canonical URLs, sitemap membership, the custom 404 and consent behavior.

## 9. SEO, accessibility and privacy invariants

**Implemented:** page-specific titles/descriptions, canonical URLs, Open Graph site/locale/title/description/URL, favicon and sitemap discovery in the shared layout. The guide sets `og:type=article` and an Article JSON-LD object with publisher, canonical page and 18 October 2026 publication/modification dates. FAQ content uses native disclosures; no FAQ JSON-LD is present.

The live sitemap index points to `sitemap-0.xml`, which contains exactly the five HTTP-200 page routes in section 3. `robots.txt` allows crawling and references the sitemap index. The custom 404 has no canonical link, declares noindex, and is absent from the sitemap. Canonicals matched each clean public URL at audit time. Do not claim these checks prove current Google indexing/ranking.

Preserve semantic headings, explicit field labels/hints/errors, native forms/selects/disclosures, skip link, visible keyboard focus, responsive layouts and readable result wrapping. Calculator result summaries use polite atomic live regions with 500 ms YouTube / 400 ms sponsorship debounce. Those accessibility delays are not analytics-event semantics. CSS supports stacked mobile calculator layouts and horizontally scrollable guide tables. Full browser visual/accessibility conformance has not been certified by this source/HTTP audit.

Keep the promise that calculator assumptions stay on the page. Consent-choice storage and Google analytics are separate from calculator-input persistence. No input persistence, user accounts, payment flow, ads or affiliate integration should be implied as implemented. Analytics failure must not affect the core product.

## 10. Gap register and ordered follow-up

| ID / order | Observed gap or constraint | Required outcome / status |
| --- | --- | --- |
| SPEC-01 | Old local branch/README/specs omit the current guide, deployment or GA4 behavior | This document establishes the remote-main baseline. README/history remain unchanged; reconcile stale documentation when applying ANA-02. |
| ANA-02 | No calculator-use events; Sponsorship still owns the primary home CTA/header | Implement and verify section 7-8 requirements before production scaling. Next product initiative. |
| AUTO-02 | No Earnometry Operator implementation/configuration in the audited repository | After measurement baseline, build one Operator with Portfolio & Research, Asset Factory, and Measurement & State. Define its storage/execution location in that task; this document does not invent one. |
| DISC-01 | No demand opportunity map in the migration package or audited repository | After Operator baseline, research/rank 20-30 creator-economics opportunities with demand, gap, commercial intent, tool fit, evergreen value, effort and monetization path. |
| MON-01 | Monetization is hypothetical; no live revenue mechanism in this site | Quantify traffic/conversion/unit economics from demand evidence before building a paid product. |
| ACT-01 | New asset has not been selected | Keep production on hold through the prerequisite work; select from DISC-01 evidence, without forcing a video or paired Short. |
| State reconciliation | Migration JSON/trackers are frozen as of 24 October and still point at MIG-01 | Preserve their history. The next authorized state/tracker revision should record verified GitHub access, SPEC-01 completion and ANA-02 as next; no such revision is claimed here. |

GitHub access was verified for this chat. Do not infer connected GA4, Search Console, YouTube/vidIQ, Descript, Metricool or Runway accounts from strategy plans or public website tags. Connect capabilities incrementally when their phase requires them. Spec creation grants no permission to publish, deploy, schedule external content, change accounts, buy services or perform destructive actions.

## 11. Audit evidence and validation limits

Completed on 25 October 2026:

- Inspected the complete remote repository tree and relevant product/build/test source at the pinned main commit. The tree contains no `AGENTS.md`, Operator implementation or migration strategy/state files.
- Verified the successful GitHub Pages deployment run associated with that exact commit.
- Fetched all five public pages directly: HTTP 200, expected titles and matching canonicals; GA4 tag present. Confirmed Article structured data on the published guide.
- Fetched `robots.txt`, `sitemap-index.xml` and `sitemap-0.xml`: HTTP 200; confirmed the five canonical routes and 404 exclusion. A deliberately missing URL returned HTTP 404 and the custom page.
- Executed the existing remote-commit calculation tests against unchanged copies of `src/lib/` and `tests/`, using Node v24.19.0: **42 passed, 0 failed, 0 skipped**. Coverage includes every sponsorship option combination, bounds, invalid values, exact rounding, separate-format revenue, planning ranges and independent targets.
- Created only this product-specification file in the repository. No application code, legacy documentation, tracker, state, branch, deployment or published content was changed.

No fresh dependency installation, `astro check`, `astro build`, interactive browser/visual QA, GA4 delivery test or Search Console account inspection was performed for this documentation-only task. The existing successful deployment is build evidence for the audited commit, not a newly executed local build. These limits do not prevent source documentation; the relevant checks remain mandatory when implementing ANA-02.

Primary implementation evidence, all at the audited commit:

- [Build configuration](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/astro.config.mjs), [package/toolchain](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/package.json), [deployment workflow](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/.github/workflows/deploy.yml).
- [Shared layout, metadata, GA4 and consent](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/src/layouts/BaseLayout.astro), [homepage](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/src/pages/index.astro).
- [YouTube component](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/src/components/YouTubeCalculator.astro), [YouTube calculation/validation](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/src/lib/youtube.ts), [YouTube regression tests](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/tests/youtube.test.mjs).
- [Sponsorship component](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/src/components/SponsorshipCalculator.astro), [Sponsorship calculation/validation](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/src/lib/sponsorship.ts), [Sponsorship regression tests](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/tests/sponsorship.test.mjs).
- [Published guide and Article schema](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/src/pages/guides/how-many-youtube-views-to-make-1000.astro), [guide directory](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/src/pages/guides/index.astro), [404 source](https://github.com/earnometry/earnometry-web/blob/cea165b97def96fecc35e4f8ae23fa0c742d7803/src/pages/404.astro).

## 12. ANA-02 local implementation addendum (25 October 2026)

The user authorized synchronizing main and implementing ANA-02. Local main was fast-forwarded to the audited remote commit; work is isolated on `codex/ana-02-product-measurement`. The original migration ZIP, historical specifications and calculator arithmetic remain unchanged.

The homepage hero, first featured tool and first navigation link now prioritize the YouTube calculator; Sponsorship and the existing guide remain available. Home audience copy follows the YouTube-creator focus. The shared analytics helper implements all five events, the fixed-context allowlist, explicit-consent and loaded-tag gates, actual-change detection and in-memory page-level deduplication. Google-tag load does not itself replay earlier interactions. The existing Google tag/configuration and denied ad-consent settings are retained.

Local verification passed: **53 unit tests** (42 existing calculation tests plus 11 measurement tests), **Astro check with zero errors/warnings/hints**, production build, and **13 browser scenario groups** using the built output, Chrome 155 and a simulated Google tag. Browser checks included all 12 CTA activations, consent transitions, stale stored grants after failed consent writes, blocked/missing/throwing tag, unavailable storage, independent targets and zero results, passive history/synthetic updates, no JavaScript, five public routes at 320/390/768/1280 px, canonicals, Article metadata, sitemap and custom 404. The added follow-up scenario covers bounded callback navigation, duplicate callbacks and native middle-click behavior. Local QA sent no events to Google; separate identified real-tag production QA is described below.

The local operating workspace holds `EARNOMETRY_STRATEGY.md` (an unchanged copy from the migration archive) and a current `EARNOMETRY_STATE.json` revision recording operational progress and the production hold. Those operating files and the migration ZIP are excluded from the public application release. The archive and workbook snapshots remain untouched; their performance evidence is dated 24 October.

See [ANA-02_IMPLEMENTATION.md](ANA-02_IMPLEMENTATION.md) for the complete CTA registry, parameter rules, verification method and release evidence. Source-code emission/local browser evidence is not proof of receipt in GA4. **ANA-02 remains pending authenticated property-side delivery verification; do not treat the full measurement initiative as complete or start new asset production.** No live GA4 key-event/custom-dimension settings have been changed by this work.

## 13. Production transport verification and bounded navigation

The initial production release is merge `e6cfb6d9b48ddbb6f4aa828e892315accfc82c12`, deployed successfully by GitHub Pages run `40173435332`. Public homepage hierarchy and calculator arithmetic matched the implementation. Identified real-tag QA confirmed HTTP 204 collection responses for four event types; a focused probe showed that `internal_cta_clicked` could be lost during immediate navigation even though the helper emitted it.

The follow-up changes only consented, measured same-tab links: they navigate when Google's supported `event_callback` runs, with an independent local 200 ms fallback and `event_timeout=200`. Denied/missing analytics and modified/new-tab/download navigation retain immediate native behavior. Callback retries cannot duplicate navigation. These transport controls are separate from the business-context allowlist and do not add raw input data. This evidence-based bounded exception replaces the initial immediate-navigation implementation; it does not permit indefinite blocking or introduce a second tag/configuration.

Recheck the five normal-navigation event types after publishing the follow-up, and use [GA4_VERIFICATION.md](GA4_VERIFICATION.md) for the owner's property-side check. Transport success must not be reported as authenticated GA4 verification.
