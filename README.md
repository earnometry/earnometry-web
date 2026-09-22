# Earnometry

A small, static website with a home page and Creator Sponsorship Rate Calculator. Product requirements live in `PRODUCT_SPEC.md`; the implementation task is `CODEX_TASK_01.md`.

## Local setup

Install Node.js 24 LTS (which includes npm), then run from the repository root:

```sh
git switch codex/mvp-01
npm install
npm run dev
```

Open http://localhost:4321. The calculator is at http://localhost:4321/tools/sponsorship-rate-calculator. Stop the server with Ctrl+C. No environment variables, accounts, API keys, or external services are required.

When Astro starts a background server (for example, inside an agent environment), use `npm run dev -- stop` or `npm run preview -- stop` to stop it. The corresponding `-- status` command shows its URL and running state.

For an existing checkout that has not fetched the implementation branch, run `git fetch origin` before switching branches. On a clean checkout, `npm ci` can replace `npm install` for a lockfile-exact installation.

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

- Astro renders two static HTML pages; TypeScript adds the browser-only calculator.
- Plain CSS, system fonts, and a local SVG mark keep assets small. No client UI framework.
- `npm run build` writes the static site to `dist/`, suitable for Cloudflare Pages. Future Pages setup uses that build command and output directory with Node 24. No server adapter is needed. This task does not deploy or configure Cloudflare.
- No authentication, database, payments, analytics, cookies, input persistence, ads, or affiliate links.
- Canonical and Open Graph URLs use the intended `https://earnometry.com` domain configured in `astro.config.mjs`.

## Main files

- `src/pages/index.astro`: home page.
- `src/pages/tools/sponsorship-rate-calculator.astro`: calculator page and methodology.
- `src/components/SponsorshipCalculator.astro`: instant updates, error feedback, and result breakdown.
- `src/components/NumberField.astro` and `SelectField.astro`: reusable labeled fields.
- `src/lib/sponsorship.ts`: shared options, validation, defaults, calculation, and USD formatting.
- `src/layouts/BaseLayout.astro`: navigation, metadata, footer, and accessible page shell.
- `src/styles/`: shared responsive CSS.
- `tests/sponsorship.test.mjs`: math and validation tests.

## Calculation and assumptions

```text
base = average views / 1,000 × CPM
integrated fee = base × integration multiplier
estimate = integrated fee × (1 + usage uplift + exclusivity uplift) + production cost
range = estimate × 0.80 to estimate × 1.20
```

The two uplifts are additive, never compounded. Production cost is added after the uplifts. Calculations retain full precision until whole-dollar display formatting. Individual rounded components can differ from the rounded total by a dollar.

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

Unit tests also cover every option combination, zero CPM, input limits, and invalid values. For browser review, check immediate updates, clearing and correcting each field, keyboard focus, methodology expansion, and layouts at 320px, 390px, and desktop widths.
