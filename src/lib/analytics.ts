export type CalculatorId = 'youtube_money' | 'sponsorship_rate';
type UseEvent = 'calculator_started' | 'calculator_result_generated' | 'income_target_used';
type ProductEvent = UseEvent | 'internal_cta_clicked' | 'related_tool_clicked';
type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    earnometryAnalyticsReady?: boolean;
    earnometryAnalyticsConsent?: string | null;
  }
}

const youtubePath = '/tools/youtube-money-calculator';
const sponsorshipPath = '/tools/sponsorship-rate-calculator';
const guidePath = '/guides/how-many-youtube-views-to-make-1000';

// Fixed metadata prevents form values, query strings or link text entering events.
export const trackedLinks = {
  home_youtube_hero: { placement: 'home_hero', destination_path: youtubePath },
  home_youtube_title: { placement: 'home_card', destination_path: youtubePath },
  home_youtube_card: { placement: 'home_card', destination_path: youtubePath },
  home_sponsorship_title: { placement: 'home_card', destination_path: sponsorshipPath },
  home_sponsorship_card: { placement: 'home_card', destination_path: sponsorshipPath },
  home_guide_title: { placement: 'home_card', destination_path: guidePath },
  home_guide_card: { placement: 'home_card', destination_path: guidePath },
  guide_youtube_quick_answer: { placement: 'guide_quick_answer', destination_path: youtubePath },
  guide_youtube_inline: { placement: 'guide_body', destination_path: youtubePath },
  guide_youtube_footer: { placement: 'guide_footer', destination_path: youtubePath },
  youtube_related_sponsorship: { placement: 'related_tool', destination_path: sponsorshipPath, calculator_id: 'youtube_money', destination_calculator_id: 'sponsorship_rate' },
  sponsorship_related_youtube: { placement: 'related_tool', destination_path: youtubePath, calculator_id: 'sponsorship_rate', destination_calculator_id: 'youtube_money' },
} as const;

type LinkId = keyof typeof trackedLinks;
interface EventContext {
  calculator_id?: CalculatorId;
  cta_id?: LinkId;
}
interface AnalyticsEnvironment {
  consent: () => string | null;
  ready: () => boolean;
  path: () => string;
  tag: () => Gtag | undefined;
}

export function canonicalPagePath(path: string): string {
  return path.split(/[?#]/)[0]!.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
}

export function createAnalytics(environment: AnalyticsEnvironment) {
  function enabled(): boolean {
    try {
      return environment.consent() === 'granted' && environment.ready() && typeof environment.tag() === 'function';
    } catch {
      return false;
    }
  }

  function send(event: ProductEvent, context: EventContext): boolean {
    if (!enabled()) return false;
    try {
      const parameters: Record<string, string> = { event_version: '1', page_path: canonicalPagePath(environment.path()) };
      if (event === 'internal_cta_clicked' || event === 'related_tool_clicked') {
        if (!context.cta_id || !Object.hasOwn(trackedLinks, context.cta_id)) return false;
        const link = trackedLinks[context.cta_id];
        if ((event === 'related_tool_clicked') !== ('calculator_id' in link)) return false;
        Object.assign(parameters, link, { cta_id: context.cta_id });
      } else {
        if (!['calculator_started', 'calculator_result_generated', 'income_target_used'].includes(event)) return false;
        if (context.calculator_id !== 'youtube_money' && context.calculator_id !== 'sponsorship_rate') return false;
        if (event === 'income_target_used' && context.calculator_id !== 'youtube_money') return false;
        parameters.calculator_id = context.calculator_id;
      }
      environment.tag()!('event', event, parameters);
      return true;
    } catch {
      // Analytics must never interrupt a calculation or a navigation.
      return false;
    }
  }
  return { enabled, send };
}

const browserAnalytics = createAnalytics({
  consent: () => window.earnometryAnalyticsConsent === 'granted'
    ? window.localStorage.getItem('earnometry-analytics-consent') : null,
  ready: () => window.earnometryAnalyticsReady === true,
  path: () => window.location.pathname,
  tag: () => window.gtag,
});

interface Activity {
  kind: 'revenue' | 'range' | 'target';
  resultReady: boolean;
  targetReady?: boolean;
}

export function createCalculatorTracker(calculatorId: CalculatorId, analytics = browserAnalytics) {
  const emitted = new Set<UseEvent>();
  let targetInteracted = false;
  function once(event: UseEvent) {
    if (!emitted.has(event) && analytics.send(event, { calculator_id: calculatorId })) emitted.add(event);
  }
  return {
    edit(activity: Activity) {
      if (!analytics.enabled()) {
        targetInteracted = false;
        return;
      }
      once('calculator_started');
      if (activity.kind === 'revenue' && activity.resultReady) once('calculator_result_generated');
      if (calculatorId === 'youtube_money') {
        if (activity.kind === 'target') targetInteracted = true;
        if (targetInteracted && activity.kind !== 'range' && activity.targetReady) once('income_target_used');
      }
    },
  };
}

export function bindTrackedLinks() {
  function activate(event: MouseEvent) {
    if (event.defaultPrevented || (event.type === 'click' ? event.button !== 0 : event.button !== 1)) return;
    const target = event.target instanceof Element ? event.target : null;
    const link = target?.closest<HTMLAnchorElement>('a[data-analytics-cta]');
    const id = link?.dataset['analyticsCta'];
    if (!link || !id || !Object.hasOwn(trackedLinks, id)) return;
    const definition = trackedLinks[id as LinkId];
    const url = new URL(link.href);
    if (url.origin !== window.location.origin || canonicalPagePath(url.pathname) !== definition.destination_path) return;
    browserAnalytics.send('calculator_id' in definition ? 'related_tool_clicked' : 'internal_cta_clicked', { cta_id: id as LinkId });
  }
  document.addEventListener('click', activate);
  document.addEventListener('auxclick', activate);
}
