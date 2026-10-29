/**
 * A DOM good enough to drive the real app, without a browser.
 *
 * Why this exists
 * ---------------
 * There is no browser in this environment and no route to install one: the
 * egress allowlist reaches npm but not the CDNs Playwright and Puppeteer
 * download Chromium from. `render.test.tsx` renders screens to static HTML with
 * `react-dom/server`, which proves markup and accessible names but cannot prove
 * anything that only happens *after* a person acts — that the back button
 * returns to the previous screen instead of leaving Kinship, that Escape closes
 * a dialog, that switching storage off deletes rather than hides, that declining
 * a suggestion can be undone. jsdom can, and it installs from npm.
 *
 * What it proves, and what it does not
 * ------------------------------------
 * jsdom has no layout engine. `getBoundingClientRect()` returns zeros and CSS
 * does not cascade, so nothing built on this harness may claim to verify
 * overflow, clipping, spacing, focus rings or contrast. It verifies behaviour
 * and DOM semantics. Appearance is still unverified and still disclosed as such.
 *
 * Controlled inputs cannot be driven here at all. Setting `.value` through the
 * native prototype setter and dispatching `input`/`change` changes the DOM value
 * but React's own value tracker never sees it, so `onChange` does not fire for
 * text inputs, textareas or range sliders — verified by reading the rendered
 * `value` prop back off the element's React props, which stayed empty. jsdom
 * also does not run a form's submit activation behaviour, so a `type="submit"`
 * click reaches nothing. `setInput` is kept for that diagnosis, not for tests:
 * drive behaviour through buttons instead (the place picker, the switches, the
 * nav), which are real events React does handle. Anything that can only be
 * reached by typing — the free-text story parser, the birth-year slider — is
 * NOT covered by automation and must not be reported as verified.
 *
 * Hermetic by default
 * -------------------
 * `mountApp()` stubs `fetch` to reject, so the app takes its own documented
 * offline path (the deterministic collection in `server/kinshipQlooEngine.ts`)
 * and the test run needs no server, no network and no credential. Pass
 * `{ apiBase: 'http://localhost:3000' }` to forward relative requests to a
 * running server instead — useful locally, never used by CI.
 */
import { JSDOM } from 'jsdom';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';

export interface MountedApp {
  w: any;
  root: Root;
  /** Visible text of the whole document, whitespace collapsed. */
  text(): string;
  html(): string;
  buttons(): any[];
  /** First button whose text equals `label`, else starts with it. */
  button(label: string): any;
  byId(id: string): HTMLElement | null;
  hash(): string;
  storage: Storage;
  tick(ms: number): Promise<void>;
  click(labelOrElement: any): Promise<any>;
  key(key: string, target?: any): Promise<void>;
  setInput(element: any, value: string): Promise<void>;
  activeLabel(): string | null;
  consoleErrors: string[];
  teardown(): void;
}

export interface MountOptions {
  /** Forward relative requests here instead of failing them. */
  apiBase?: string;
  /** Extra milliseconds to let the engine settle after mount. */
  settleMs?: number;
}

export async function mountApp(options: MountOptions = {}): Promise<MountedApp> {
  const { apiBase, settleMs = 2000 } = options;

  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
  const w: any = dom.window;

  // Tailwind's responsive classes are irrelevant here (no layout), but code that
  // reads matchMedia must not throw.
  w.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  });
  // jsdom logs "Not implemented: Window's scrollTo()" as a virtual-console error
  // on every route change. Scrolling is not what these tests are about.
  w.scrollTo = () => {};

  const realFetch = globalThis.fetch;
  const realConsoleError = console.error;
  const consoleErrors: string[] = [];
  console.error = (...args: unknown[]) => {
    consoleErrors.push(args.map(String).join(' '));
  };

  globalThis.fetch = (async (input: any, init?: any) => {
    if (typeof input === 'string' && input.startsWith('/')) {
      if (!apiBase) throw new Error('no API in the test harness — taking the offline path');
      return realFetch(apiBase + input, init);
    }
    return realFetch(input, init);
  }) as typeof fetch;

  for (const key of [
    'window', 'document', 'navigator', 'localStorage', 'history', 'location',
    'HTMLElement', 'HTMLInputElement', 'Element', 'Node', 'Event', 'MouseEvent',
    'KeyboardEvent', 'CustomEvent', 'getComputedStyle', 'requestAnimationFrame',
    'cancelAnimationFrame',
  ]) {
    if (w[key] === undefined) continue;
    // Node 22 exposes `navigator` as a getter-only global, so assignment throws.
    Object.defineProperty(globalThis, key, { value: w[key], writable: true, configurable: true });
  }
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

  const { App } = await import('../../src/App');
  const root = createRoot(w.document.getElementById('root')!);
  await act(async () => {
    root.render(React.createElement(App));
  });
  await tick(settleMs);

  const api: MountedApp = {
    w,
    root,
    text: () => (w.document.body.textContent ?? '').replace(/\s+/g, ' '),
    html: () => w.document.body.innerHTML,
    buttons: () => [...w.document.querySelectorAll('button')],
    button: (label: string) =>
      api.buttons().find((b) => b.textContent.trim() === label) ??
      api.buttons().find((b) => b.textContent.trim().startsWith(label)),
    byId: (id: string) => w.document.getElementById(id),
    hash: () => w.location.hash,
    storage: w.localStorage,
    tick,
    async click(labelOrElement: any) {
      const el = typeof labelOrElement === 'string' ? api.button(labelOrElement) : labelOrElement;
      if (!el) throw new Error(`no such control: ${labelOrElement}`);
      await act(async () => {
        el.dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
      });
      await tick(700);
      return el;
    },
    async key(key: string, target?: any) {
      const el = target ?? w.document.activeElement ?? w.document.body;
      await act(async () => {
        el.dispatchEvent(new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      });
      await tick(400);
    },
    /**
     * Set a controlled input the way React notices: through the native value
     * setter, then an input event. Assigning `.value` directly is invisible to
     * React's synthetic event system.
     */
    async setInput(element: any, value: string) {
      const setter = Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value')!.set!;
      await act(async () => {
        setter.call(element, value);
        element.dispatchEvent(new w.Event('input', { bubbles: true }));
        element.dispatchEvent(new w.Event('change', { bubbles: true }));
      });
      await tick(1500);
    },
    activeLabel: () => {
      const a = w.document.activeElement;
      return a ? a.getAttribute('aria-label') ?? a.textContent?.trim().slice(0, 60) : null;
    },
    consoleErrors,
    teardown() {
      console.error = realConsoleError;
      globalThis.fetch = realFetch;
      root.unmount();
      w.close();
    },
  };
  return api;
}

/** Advance timers and flush React work. Exported for tests that wait on their own. */
export async function tick(ms: number): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

/**
 * Console noise that is a property of the harness rather than a defect in the
 * app. Deliberately narrow: only jsdom's unimplemented browser APIs and React's
 * "not wrapped in act" warning, which is unavoidable when an engine response
 * lands between two awaited interactions. Everything else fails the run.
 */
export function realConsoleErrors(errors: string[]): string[] {
  return errors.filter((e) => !/Not implemented:|not wrapped in act/i.test(e));
}
