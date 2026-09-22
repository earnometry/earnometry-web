# Earnometry

A small, static website with a home page, Creator Sponsorship Rate Calculator, and YouTube Money Calculator. The original MVP requirements live in `PRODUCT_SPEC.md` and `CODEX_TASK_01.md`; the approved second-tool requirements are in `PRODUCT_SPEC_02.md`.

## Local setup

Install Node.js 24 LTS (which includes npm), then run from the repository root:

```sh
npm install
npm run dev
```

Open http://localhost:4321. The tools are at http://localhost:4321/tools/sponsorship-rate-calculator and http://localhost:4321/tools/youtube-money-calculator. Stop the server with Ctrl+C. No environment variables, accounts, API keys, or external services are required.

When Astro starts a background server (for example, inside an agent environment), use `npm run dev -- stop` or `npm run preview -- stop` to stop it. The corresponding `-- status` command shows its URL and running state.

On a clean checkout, `npm ci` can replace `npm install` for a lockfile-exact installation.

## Check and build

```sh
npm run check
npm test
npm run build
npm run preview
```

`check` uses Astro diagnostics and strict TypeScript checking. No separate ESLint toolchain is installed. Tests use Node's built-in test runner and native TypeScript support, with no additional test framework. `preview` serves the production build at http://localhost:4321. Run one server at a time to use that port; Astro prints its actual URL if it is occupied.

### Windows application-control compatibility

If your Windows policy blocks `astro.win32-x64-msvc.node`, Astro can use its official WebAssembly compiler fallback. For the pinned Astro version in this repository, install the matching optional compiler locally:

```sh
npm install --no-save --package-lock=false --force @astrojs/compiler-binding-wasm32-wasi@0.4.1
```

The package declares a `wasm32` CPU target, so this one local install needs `--force` on an x64 machine. This does not change the project dependencies or lockfile. Astro loads it automatically when the native compiler is unavailable. Node emits an experimental WASI runtime notice with this fallback; this is separate from Astro code diagnostics. A fresh `npm ci` removes the local fallback, so repeat the command if needed. The normal native build and Cloudflare's Linux build do not need this workaround.

## Architecture and deployment target

- Astro renders the home page, both calculators, and a custom 404 as static HTML; TypeScript adds browser-only calculations.
- Plain CSS, system fonts, and a local SVG mark keep assets small. No client UI framework.
- `npm run build` writes the static site to `dist/`, suitable for Cloudflare Pages. Future Pages setup uses that build command and output directory with Node 24. No server adapter is needed. This task does not deploy or configure Cloudflare.
- Each calculator builds as an `.html` file so Cloudflare Pages' extensionless URL matches its links and canonical URL, without a trailing slash.
- No authentication, database, payments, analytics, cookies, input persistence, ads, or affiliate links.
- Canonical and Open Graph URLs use the intended `https://earnometry.com` domain configured in `astro.config.mjs`.
- The official `@astrojs/sitemap` integration generates `dist/sitemap-index.xml` and `dist/sitemap-0.xml`. `public/robots.txt` allows crawlers and points to the sitemap index; Astro copies it to `dist/robots.txt`.
- The top-level `dist/404.html` lets Cloudflare Pages serve missing URLs as 404 responses instead of falling back to the homepage. The error page is marked `noindex` and excluded from the sitemap.

## Main files

- `src/pages/index.astro`: home page.
- `src/pages/404.astro`: custom not-found page using the shared layout.
- `public/robots.txt`: crawler access and sitemap discovery.
- `src/pages/tools/sponsorship-rate-calculator.astro`: calculator page and methodology.
- `src/components/SponsorshipCalculator.astro`: instant updates, error feedback, and result breakdown.
- `src/components/NumberField.astro` and `SelectField.astro`: reusable labeled fields.
- `src/lib/sponsorship.ts`: shared options, validation, defaults, calculation, and USD formatting.
- `src/layouts/BaseLayout.astro`: navigation, metadata, footer, and accessible page shell.
- `src/styles/`: shared responsive CSS.
- `tests/sponsorship.test.mjs`: math and validation tests.
- `src/pages/tools/youtube-money-calculator.astro`: YouTube calculator page, methodology, worked examples, and contextual link.
- `src/components/YouTubeCalculator.astro`: blank initial form, independent result states, inline errors, and accessible updates.
- `src/lib/youtube.ts`: exact decimal parsing, revenue/range/target calculations, validation, and formatting.
- `src/styles/youtube.css`: scoped additions using the existing calculator styles.
- `tests/youtube.test.mjs`: revenue, planning, reverse-calculation, validation, and rounding tests.

## Sponsorship calculation and assumptions

```text
base = average views / 1,000 × CPM
integrated fee = base × integration multiplier
estimate = integrated fee × (1 + usage uplift + exclusivity uplift) + production cost
range = estimate × 0.80 to estimate × 1.20
```

The two uplifts are additive, never compounded. Production cost is added after the uplifts. Integer arithmetic retains the fractions from the inputs and multipliers until whole-dollar display rounding, avoiding binary floating-point errors at half-dollar boundaries. Individual rounded components can differ from the rounded total by a dollar.

Defaults are 50,000 views, $25 CPM, integrated segment, no usage rights, no exclusivity, and $0 production. These are example assumptions, not market benchmarks. Estimates and the ±20% range are illustrative, not guaranteed market prices or earnings.

Views must be whole numbers from 0 to 1 billion. CPM accepts $0–$10,000 and production cost accepts $0–$1,000,000, both with up to two decimal places. These upper limits are technical guardrails, not claims about typical rates. Empty, negative, nonfinite, or out-of-range inputs clear the result and receive inline errors. With zero views or zero CPM, only production cost contributes. Without JavaScript, inputs are disabled and a notice identifies the static result as the prefilled example.

## Representative verification cases

| Case | Inputs differing from defaults | Estimate | Range |
| --- | --- | --- | --- |
| Default | None | $1,250 | $1,000–$1,500 |
| Product-spec example | Organic reuse, 30 days, $100 production | $1,788 | $1,430–$2,145 |
| Short mention | 10,000 views, $20 CPM, short mention | $120 | $96–$144 |
| Dedicated video | 100,000 views, $40 CPM, dedicated, paid usage, 90 days, $500 production | $11,300 | $9,040–$13,560 |
| No views | 0 views, $100 production | $100 | $80–$120 |
| All zero | 0 views, $0 CPM, $0 production | $0 | $0–$0 |
| Decimal inputs | 12,345 views, $12.34 CPM, $99.99 production | $252 | $202–$303 |

Unit tests also cover every option combination, zero CPM, input limits, invalid values, and exact half-dollar rounding. For browser review, check immediate updates, clearing and correcting each field, keyboard focus, methodology expansion, and layouts at 320px, 390px, and desktop widths. Navigate home and back after editing inputs to verify that any values restored by the browser still match the result.

## YouTube calculation and assumptions

The form starts blank; no RPM is supplied as a market rate. Enter long-form views (0 for Shorts only), each active format's RPM, and optional Shorts views. Blank optional Shorts views mean 0. Use matching time periods, revenue scope, and view definitions; YouTube Studio's Shorts RPM requires the corresponding engaged views.

```text
long-form monthly revenue = long-form views / 1,000 × long-form RPM
Shorts monthly revenue = matching Shorts views / 1,000 × Shorts RPM
monthly revenue = long-form revenue + Shorts revenue
annual revenue = monthly revenue × 12
average daily revenue = annual revenue / 365
views needed for each format alone = ceiling(monthly target × 1,000 / its RPM)
```

Optional low/high RPM pairs produce a monthly planning range with views fixed. Each pair must contain its central RPM. An omitted pair holds that format at its central RPM; zero-view formats have disabled range inputs and contribute zero. No range appears until an active format has a complete pair. Range and target errors do not hide valid revenue results.

The target alternatives are total monthly views for long-form only OR Shorts only, not additional views or a combined strategy. Zero target needs zero views. A positive target is unreachable at zero RPM. Valid counts exceeding the input limit remain uncapped and are labeled accordingly.

Views allow whole numbers up to 1 billion per format, RPM up to $10,000 with four decimal places, and a monthly target up to $1,000,000 with two decimal places. Exact integer fractions preserve precision through calculation, including division by 365. Only display values round half up to cents; positive amounts rounding to zero show `<$0.01`. These technical limits and the hypothetical $3.00/$0.05 educational RPMs are not benchmarks. Projections assume unchanged monthly performance, before creator taxes and expenses.

| YouTube verification case | Monthly | Daily average | Annual |
| --- | --- | --- | --- |
| 100,000 long-form views at $3 RPM | $300.00 | $9.86 | $3,600.00 |
| 1,000,000 Shorts views at $0.05 RPM | $50.00 | $1.64 | $600.00 |
| Both cases combined | $350.00 | $11.51 | $4,200.00 |
| 100 long-form views at $0.05 RPM | $0.01 | <$0.01 | $0.06 |

For the combined case, $2–$4 long-form RPM and $0.02–$0.08 Shorts RPM give a $220.00–$480.00 monthly range. A $1,000 target at the central RPMs needs 333,334 long-form-only views OR 20,000,000 Shorts-only views. The full edge-case matrix is in `PRODUCT_SPEC_02.md` and the tests.

Browser review should cover blank/zero/error states, range activation and correction, target independence, polite result announcements, keyboard access to all fields and disclosures, and back/forward restoration. Review 320px, 390px, tablet, and desktop layouts with maximum values and errors. With JavaScript disabled, inputs must be disabled while the explanatory notice, formulas, examples, and links remain usable. Verify the homepage card, both contextual links, unique metadata, one new sitemap URL, `robots.txt`, and `404.html` in the production build.
