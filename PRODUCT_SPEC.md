# Earnometry - Product Specification

Version: 0.1
Status: MVP
Primary domain: earnometry.com
Repository: earnometry/earnometry-web

## 1. Product goal

Earnometry is a lightweight website with free calculators and practical guides for creators, solopreneurs, and small online businesses.

The business goal is to build useful evergreen tools that can attract search and YouTube traffic and later monetize through ads and affiliate links, while requiring very little ongoing support.

The MVP must be intentionally simple: no accounts, no login, no database, no payments, no user-generated content, and no backend.

## 2. Audience

Initial market: United States.
Language: English.
Primary users:
- creators
- solopreneurs
- small ecommerce operators
- people selling digital products or services online

## 3. Brand

Brand name: Earnometry
YouTube handle: @getearnometry
Tagline: Make sense of the numbers.

Suggested visual direction:
- clean
- calm
- trustworthy
- practical rather than flashy
- cream/off-white background
- dark green and medium green accents
- dark near-black text

Do not over-design the MVP.

## 4. Technical architecture

Use a static-first architecture optimized for speed, SEO, and low maintenance.

Preferred stack:
- Astro
- TypeScript
- plain CSS or simple scoped CSS
- no React unless there is a strong reason
- npm

Deployment target:
- Cloudflare Pages

Requirements:
- static output
- calculator logic runs in the browser
- no server-side persistence
- no database
- no authentication
- no cookies in the MVP
- no analytics in the first build
- no external paid API
- no external UI framework unless clearly justified

The project must run locally with standard npm commands and build without warnings or errors.

## 5. MVP scope

The first release contains:

1. Home page
2. One working calculator: Creator Sponsorship Rate Calculator
3. About / methodology section integrated into the calculator page
4. Simple footer with disclaimer
5. Reusable layout and calculator components so more tools can be added quickly

Do not build empty pages or features that are not needed for the MVP.

## 6. Home page

URL: /

Content:
- Earnometry brand name
- tagline: "Make sense of the numbers."
- short value proposition:
  "Free calculators and practical guides for creators, solopreneurs, and online businesses."
- featured tool card linking to the sponsorship calculator
- short section explaining what Earnometry provides
- placeholder text mentioning that more tools are coming, without creating fake links

Primary CTA:
- "Calculate your sponsorship rate"

## 7. Creator Sponsorship Rate Calculator

URL suggestion:
/tools/sponsorship-rate-calculator

Purpose:
Provide a transparent estimate for what a creator might charge for a sponsored video or integration.

The calculator must clearly say that the result is an estimate, not a guaranteed market rate.

### Inputs

Required:
1. Average views per sponsored video
   - numeric
   - minimum 0
   - example default: 50000

2. Base sponsorship CPM in USD
   - numeric
   - editable by the user
   - example default: 25
   - explain that CPM is an assumption and should be adjusted by niche, audience, geography, and demand

3. Integration type
   Options:
   - Short mention: multiplier 0.60
   - Integrated segment: multiplier 1.00
   - Dedicated video: multiplier 1.50

4. Usage rights
   Options:
   - None: +0%
   - Organic brand reuse: +20%
   - Paid advertising usage: +50%

5. Exclusivity
   Options:
   - None: +0%
   - 30 days: +15%
   - 90 days: +30%

6. Additional production cost
   - numeric USD
   - default 0
   - for special filming, editing, travel, props, etc.

### Calculation

Base fee:

average_views / 1000 * base_CPM

Apply integration multiplier.

Then apply usage-rights and exclusivity uplifts to the multiplied base fee.

Then add production cost.

Suggested estimate = resulting amount.

Display an indicative negotiation range:
- low = estimate * 0.80
- high = estimate * 1.20

Round display values to sensible whole-dollar amounts.

### Result presentation

Show:
- Suggested estimate
- Indicative range
- concise breakdown of each component
- formula / methodology expandable section
- reminder that rates vary and negotiation matters

Never imply that the output is an authoritative or guaranteed market price.

## 8. UX requirements

- Mobile-first responsive design
- Works well at desktop widths
- Calculator updates instantly when inputs change
- Inputs must have labels
- Keyboard accessible
- Reasonable focus states
- High text contrast
- Do not rely on color alone to convey meaning
- Avoid popups
- Avoid account creation
- Avoid newsletter capture in MVP

## 9. SEO requirements

Each page needs:
- unique title
- meta description
- canonical URL placeholder based on https://earnometry.com
- Open Graph basics
- semantic heading structure

Calculator page target concept:
- creator sponsorship rate calculator

Do not keyword-stuff.

Add structured data only if it is clearly valid for the page type. Do not invent ratings, reviews, or FAQ claims.

## 10. Content and legal safety

Footer disclaimer:
"Earnometry provides estimates for educational and informational purposes only. Results are not financial, legal, tax, or professional advice."

Do not collect personal information in the MVP.
Do not add medical, legal, investment, or tax advice.
Do not add claims such as "industry standard" unless a source is later provided.

## 11. Performance

Targets:
- very fast static site
- minimal JavaScript
- optimized images
- no unnecessary third-party scripts
- Lighthouse-friendly implementation

## 12. Project structure

Keep the repository easy for an AI coding agent and a human to understand.

Suggested structure:

src/
  components/
  layouts/
  pages/
    index.astro
    tools/
      sponsorship-rate-calculator.astro
  styles/
public/
  brand/

Add a short README covering:
- purpose
- install
- local development
- build
- deployment target

## 13. Quality requirements

Before considering the MVP complete:
- npm install succeeds
- npm run dev starts the project
- npm run build succeeds
- calculator produces the expected result for documented test cases
- no obvious console errors
- mobile layout is usable
- desktop layout is usable
- links work
- page titles and metadata are present

Create a small set of unit tests for the calculator math if practical without adding heavy tooling.

## 14. Example calculation for verification

Inputs:
- Average views: 50,000
- Base CPM: $25
- Integration: Integrated segment (1.00)
- Usage rights: Organic brand reuse (+20%)
- Exclusivity: 30 days (+15%)
- Production cost: $100

Expected calculation:
- base fee = 50,000 / 1,000 * 25 = 1,250
- integration = 1,250
- usage + exclusivity uplift = 35% of 1,250 = 437.50
- subtotal = 1,687.50
- plus production = 1,787.50
- suggested estimate displayed approximately as $1,788
- range approximately $1,430 to $2,145

## 15. Explicit non-goals for MVP

Do not add:
- user accounts
- authentication
- database
- payment system
- subscriptions
- email capture
- comments
- AI chatbot
- CMS
- admin panel
- affiliate links before programs are approved
- ads before traffic exists
- multiple calculators in the first coding task

The goal of the first coding task is to validate the entire build-and-deploy pipeline with one high-quality utility.
