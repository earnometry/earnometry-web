# Earnometry - YouTube Money Calculator

Version: 0.1
Status: Proposed specification; implementation not authorized yet
Primary domain: https://earnometry.com
Repository: earnometry/earnometry-web
Target URL: /tools/youtube-money-calculator

## 1. Goal and scope

Build a transparent, low-maintenance calculator that helps creators estimate YouTube revenue from their own monthly views and RPM assumptions, compare planning scenarios, and calculate views needed for a monthly income target.

This specification extends PRODUCT_SPEC.md with a second tool. It supersedes that document's one-calculator scope only for this addition and its required cross-links. Existing brand, privacy, performance, and architecture requirements continue to apply. Keep PRODUCT_SPEC.md and CODEX_TASK_01.md unchanged.

The deliverable will be one calculator page, educational content on that page, a homepage listing, and contextual links between the two calculators. Do not redesign the site or change sponsorship calculations.

This document proposes concrete behavior. Section 13 identifies choices to confirm before implementation.

## 2. Audience and estimation principles

- English-speaking creators; initial audience is the United States. Use USD only.
- Use explicit user-entered assumptions. Do not supply a universal payout rate, market benchmark, or automatic niche/country multiplier.
- Estimates represent creator revenue covered by the entered RPM, before the creator's taxes and expenses. They are not profit, guaranteed payments, or guaranteed earnings.
- Do not subtract a platform share again from an RPM that already represents creator revenue.
- Keep long-form and Shorts calculations separate before adding their revenue. Do not average their RPMs without weighting.
- Use matching time periods, formats, revenue scope, and view definitions when taking inputs from analytics. Do not apply one channel-wide revenue total independently to both formats.
- Assume unchanged monthly views and RPM for annual projections. Do not imply a forecast of growth, seasonality, or future payouts.

## 3. Inputs and initial state

Use visible labels, units, and concise helper text. Put optional planning assumptions and the income target after the primary inputs; reuse existing components and styling where practical.

| Input | Initial state | Behavior |
| --- | --- | --- |
| Monthly long-form views | Blank | Required for the revenue estimate; enter 0 for a Shorts-only scenario. |
| Long-form RPM (USD per 1,000 views) | Blank | Required when long-form views are positive. An explicit 0 is valid. |
| Monthly Shorts views (optional) | Blank | Blank means no Shorts views; equivalent to 0. |
| Shorts RPM (USD per 1,000 views) | Blank | Required when Shorts views are positive. An explicit 0 is valid. |
| Low / high long-form RPM (optional pair) | Both blank | Defines the long-form planning range. |
| Low / high Shorts RPM (optional pair) | Both blank | Defines the Shorts planning range independently. |
| Monthly income target (USD) | Blank | Used only for reverse calculation; blank leaves that output unset. |

Do not prefill RPMs. Numerical examples belong in explanatory content and must be explicitly hypothetical. Initial revenue results show an instruction to enter views and RPM, not a fabricated estimate. Do not show errors before an input has been interacted with.

For Shorts, helper text must explain that the view count must match the entered RPM's denominator. When using YouTube Studio's Shorts RPM, use the corresponding engaged views, not an incompatible public view counter. Preserve the simple input label and explain this distinction beside it.

If a format has zero views, its RPM may be blank and its estimated revenue is zero. A supplied RPM can still be used for that format's reverse calculation. Any supplied invalid RPM receives an error rather than being silently replaced.

## 4. Validation and number handling

- Views: whole numbers from 0 to 1,000,000,000 for each format.
- All RPM inputs: USD 0 to 10,000, with up to four decimal places so small Shorts assumptions remain usable.
- Income target: USD 0 to 1,000,000, with up to two decimal places.
- These maxima are technical guardrails, not statements about typical earnings or rates. Explain them in helper text or methodology.
- Reject negative, nonnumeric, nonfinite, over-limit, fractional-view, and excessive-precision values. Treat whitespace-only values as blank. Never silently clamp invalid inputs or substitute an example rate.
- Associate inline errors with their inputs. Do not rely on color alone. Clear stale dependent results while input is invalid; restore them immediately after correction.
- Invalid or missing required revenue inputs make the combined revenue estimate unavailable. Do not show a partial total as if it were complete.
- Invalid planning-range inputs affect the range only. An invalid target affects reverse calculation only. A reverse scenario depends on its target and RPM, not current views or planning-range inputs.
- Preserve decimal precision through intermediate calculations. Do not round revenue components before summing or before deriving daily, annual, or reverse results.
- Display USD amounts to two decimal places, rounding half up. If a positive amount rounds to zero, show `<$0.01`; show `$0.00` for an exact zero. Explain that independently rounded components can differ from their displayed total by a cent.
- Display required views as whole numbers rounded upward. Never round a required-view count down or cap it at the input limit. Explain when a valid result exceeds the views input limit.

## 5. Revenue formulas and outputs

Let:

- `VL` = monthly long-form views; `RL` = long-form RPM.
- `VS` = monthly Shorts views on the matching measurement basis; `RS` = Shorts RPM.

Formulas:

```text
Long-form monthly revenue = VL / 1,000 * RL
Shorts monthly revenue    = VS / 1,000 * RS
Monthly revenue          = long-form revenue + Shorts revenue
Annual revenue           = monthly revenue * 12
Average daily revenue    = annual revenue / 365
```

Show estimated monthly revenue prominently, followed by average daily and annual revenue and a clearly labeled long-form versus Shorts monthly breakdown. Daily revenue is a normalized average using 365 days per year, not an estimate for a particular calendar day. Annual revenue assumes the same monthly scenario repeats 12 times.

Use zero contribution for an absent format without dividing by its views. Both formats at zero views produce zero revenue. Zero RPM produces zero revenue for that format regardless of views. A hypothetical positive RPM does not establish monetization eligibility or prove that views will earn revenue.

Make formulas and assumptions available as static explanatory content, with an accessible disclosure for additional detail if useful.

## 6. Optional low/high planning range

Provide a separate low/high RPM pair for each active format (positive monthly views). Inactive-format range inputs are disabled and ignored.

- Both bounds blank: hold that format at its central RPM when another format supplies a range.
- One bound blank: show an inline error and no combined planning range.
- A completed pair must satisfy `0 <= low RPM <= central RPM <= high RPM`.
- At least one active format must have a completed pair before showing a range. Otherwise show a brief instruction to add assumptions, not an automatic percentage spread.

```text
Low monthly revenue  = VL / 1,000 * RL_low  + VS / 1,000 * RS_low
High monthly revenue = VL / 1,000 * RL_high + VS / 1,000 * RS_high
```

Use the central RPM for both bounds when a format has no range pair. A format with zero views contributes zero to both bounds. Equal bounds are valid.

Display this as a monthly planning range with a concise statement of the low/high RPMs used. Explain that views remain fixed and the range reflects user-selected scenarios, not measured market rates, a confidence interval, or a guaranteed minimum or maximum. No extra daily/annual range controls are required.

## 7. Views needed for an income target

Let `T` be the user's monthly income target. Show two independent alternatives, using the central RPMs:

```text
Long-form-only views needed = ceiling(T * 1,000 / RL)
Shorts-only views needed    = ceiling(T * 1,000 / RS)
```

Clearly label these as alternative ways to reach the full target if all modeled revenue came from that format. They are total monthly views required, not additional views above the entered scenario. Do not add the two results or imply they describe a combined strategy. Do not infer a format mix or introduce a mix control.

- Blank target: prompt the user to enter a target; do not show a calculated view count.
- Zero target: 0 views are needed, including when RPM is zero or blank.
- Positive target and positive RPM: calculate and round upward.
- Positive target and zero RPM: show “This target cannot be reached at a $0 RPM.” Do not display infinity.
- Positive target and blank RPM: request the relevant RPM for that alternative; the other valid alternative remains available.
- A supplied invalid RPM must be corrected for its alternative, even when the target is zero.

## 8. Educational content and disclaimer

Include concise, useful explanations of:

- RPM: creator revenue per 1,000 views on the relevant measurement basis, after platform revenue sharing. Depending on the analytics metric used, it can include more than advertising revenue.
- CPM: advertiser cost per 1,000 ad impressions; it is not the creator's RPM. Do not convert CPM to RPM using an assumed fixed percentage.
- Why earnings vary with audience, niche, geography, season, format, and monetization. Do not invent typical rate tables or unsupported payout claims.
- Why the view count must use the same denominator as the RPM, including the Shorts engaged-view distinction.
- How to use a matching historical RPM or an explicitly hypothetical assumption. If the user has no monetization revenue, a positive assumption is a planning scenario only.

Reference for definitions: [YouTube Help: Understand ad revenue analytics](https://support.google.com/youtube/answer/9314357?hl=en). Verify wording against official guidance when implementing; do not encode eligibility thresholds, revenue-share percentages, or automatic policy updates.

Include this worked-example table in static page content:

| Monthly views on the matching basis | Long-form at an assumed $3.00 RPM | Shorts at an assumed $0.05 RPM |
| --- | --- | --- |
| 10,000 | $30.00 | $0.50 |
| 100,000 | $300.00 | $5.00 |
| 1,000,000 | $3,000.00 | $50.00 |

These are separate hypothetical examples, not a combined scenario or market benchmarks. Explain one calculation explicitly: `100,000 / 1,000 * $3.00 = $300.00`. Answer the 10K/100K/1M-views search intent conditionally; never claim YouTube universally pays those amounts.

Place a concise disclaimer near the results:

> Estimates use your views and RPM assumptions. Actual revenue varies and is not guaranteed. Daily and annual figures assume the same monthly performance. Results are before your taxes and expenses and do not establish monetization eligibility.

Retain the existing site-wide footer disclaimer verbatim. Do not add sponsorship fees, merchandise, or other business income separately to these calculations. The result covers only the revenue represented by the supplied RPM; avoid double-counting revenue across tools.

## 9. SEO and cross-linking

- Primary intent: “YouTube money calculator”.
- Secondary intents: “YouTube earnings calculator”, “YouTube revenue calculator”, “YouTube RPM calculator”, “YouTube Shorts earnings calculator”, and “how much does YouTube pay for 10K / 100K / 1M views”.
- Title: `YouTube Money Calculator: Estimate Earnings | Earnometry`.
- Meta description: `Estimate YouTube earnings from your long-form and Shorts views and RPM assumptions. See monthly revenue, planning ranges, and views needed for your income goal.`
- H1: `YouTube Money Calculator`.
- Canonical: `https://earnometry.com/tools/youtube-money-calculator`, without a trailing slash or `.html`.
- Use the shared layout's Open Graph basics. Render useful copy, examples, headings, and links in static HTML. Do not keyword-stuff or create separate pages for keyword variations.
- Explain RPM in the educational content; the secondary RPM intent does not require an additional revenue-to-RPM calculator.
- Include the page automatically through the existing `@astrojs/sitemap` integration. Keep robots discovery and the top-level 404 working.
- Add a homepage tool card using the existing card style. Keep the existing calculator and update wording that incorrectly implies there is only one tool. Retain the current primary CTA.
- Link from this page to `/tools/sponsorship-rate-calculator` for estimating a separate brand-deal fee.
- Add a contextual link from the Sponsorship Rate Calculator to this page for estimating revenue from views and RPM.
- Use ordinary, descriptive links. Do not add fake reviews, ratings, keyword pages, or unnecessary structured data.

## 10. UX, accessibility, and technical constraints

- Astro, TypeScript, plain CSS, and static output compatible with Cloudflare Pages.
- Browser-only calculations; no backend, database, API calls, authentication, accounts, or user-data collection.
- No analytics changes, cookies, saved inputs, paid services, unnecessary dependencies, or third-party scripts.
- Follow the current Earnometry layout, typography, colors, spacing, focus styles, and form conventions. No redesign.
- Update results immediately after valid input changes. Use clear empty, invalid, zero, and unavailable states. Avoid stale results after browser back/forward restoration.
- Use semantic HTML, one H1, logical subheadings, associated labels and helper text, keyboard-accessible controls, visible focus, and sufficient contrast. Announce meaningful result/error changes politely without moving focus or announcing every result separately.
- Use USD formatting with grouping separators. Ensure small screens can display long numbers and input errors without horizontal overflow.
- Without JavaScript, retain readable methodology, examples, and links; disable interactive controls and explain that the calculator requires JavaScript. Do not present a static example as a live result.

## 11. Required verification cases

Unless stated otherwise, omit range inputs and target; use zero Shorts views for long-form-only cases. Compare calculations before display rounding.

| Case | Inputs | Expected result |
| --- | --- | --- |
| Long-form only | 100,000 long-form views; RPM $3 | Monthly $300.00; daily $9.86; annual $3,600.00. |
| Shorts only | 0 long-form views; blank long-form RPM; 1,000,000 Shorts views; RPM $0.05 | Monthly $50.00; daily $1.64; annual $600.00. |
| Combined | 100,000 long-form views at $3; 1,000,000 Shorts views at $0.05 | Breakdown $300.00 + $50.00; monthly $350.00; daily $11.51; annual $4,200.00. |
| Both ranges | Combined case; long-form bounds $2/$4; Shorts bounds $0.02/$0.08 | Monthly range $220.00-$480.00. |
| One range | Combined case; long-form bounds $2/$4; Shorts bounds blank | Monthly range $250.00-$450.00. |
| Zero views | Both view counts 0; RPMs blank | Daily, monthly, annual, and both contributions $0.00. |
| Zero RPM | Positive views; applicable RPMs 0 | Revenue $0.00; positive target is unreachable at those RPMs. |
| Target alternatives | Target $1,000; long-form RPM $3; Shorts RPM $0.05 | 333,334 long-form-only views OR 20,000,000 Shorts-only views. |
| Zero target | Target 0; RPMs blank or 0 | 0 required views for both alternatives. |
| Half-cent rounding | 100 long-form views at $0.05 | Exact monthly $0.005; display $0.01; annual $0.06, computed before monthly rounding. |
| Around half a cent | 99, then 101 long-form views at $0.05 | Monthly `<$0.01`, then $0.01. |
| Small RPM precision | 1,000,000 Shorts views at $0.0001 | Monthly $0.10. |
| Reverse output above input cap | Target $1,000,000; RPM $0.0001 | 10,000,000,000,000 required views; no clamping. |
| Upper revenue limits | Each format: 1,000,000,000 views at $10,000 RPM | Monthly $20,000,000,000.00; annual $240,000,000,000.00; finite results. |

Also test:

- Blank initial state, optional blank Shorts, blank required values, whitespace, negative values, nonfinite values, invalid strings, fractional views, excessive decimal precision, and values just beyond each cap.
- One missing range bound, reversed bounds, central RPM outside bounds, equal bounds, inactive-format ranges, and no ranges entered.
- Target/RPM errors affecting only dependent results; correcting errors; no stale results after navigation.
- Exact and fractional reverse quotients; verify the returned whole-view count reaches the target and one fewer view does not, using unrounded arithmetic.
- The 10K/100K/1M examples, and values immediately below, at, and above rounding boundaries.

## 12. Implementation acceptance criteria

When implementation is separately authorized:

- Add focused calculation and validation tests using the existing lightweight test setup; preserve all Sponsorship Rate Calculator tests.
- Run `npm run check`, `npm test`, and `npm run build`. Fix errors and warnings; run lint if a lint command exists. Do not add a lint toolchain solely for this task.
- Review at 320px and 390px mobile widths, tablet width, and desktop width, including maximum output values and error states.
- Test the entire form and any disclosures with a keyboard, labels/error associations, focus visibility, and result announcements.
- Check navigation, both contextual links, homepage listing, metadata, no-JavaScript behavior, and browser console errors.
- Verify the generated HTML exists, the new canonical URL appears exactly once in the generated sitemap, and robots.txt and 404.html remain present.
- Confirm the build remains entirely static with no runtime service dependency. Update README with the new tool and its assumptions.
- Do not deploy as part of implementation unless separately authorized.

## 13. Decisions to confirm before implementation

The proposed specification uses these recommendations; none requires additional features:

1. **Initial assumptions:** leave views/RPMs blank and use hypothetical rates only in educational examples, rather than prefilled estimates.
2. **Planning range:** allow independent low/high RPM pairs per format; hold a format at its central RPM when its pair is omitted.
3. **Income target:** show separate long-form-only and Shorts-only alternatives, rather than infer or request a mixed-format strategy.
4. **Time and precision conventions:** daily = monthly * 12 / 365; display currency to cents; accept RPM to four decimal places; use the technical caps in section 4.

Approve or revise these choices before implementation. No live payout rates, eligibility thresholds, or external data provider need to be selected.
