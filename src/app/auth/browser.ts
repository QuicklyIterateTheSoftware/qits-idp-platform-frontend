import { DOCUMENT, InjectionToken, inject } from '@angular/core';

/**
 * The three pieces of the browser the auth pages touch, behind one token.
 *
 * **They are injected rather than read off `window` because all three are untestable in place.**
 * `navigator.credentials` cannot be driven from a unit test — it opens an operating-system prompt.
 * `window.isSecureContext` is fixed by the URL jsdom was handed. And `location.assign` cannot even
 * be spied: every property of a `Location` is own, non-writable and non-configurable, so
 * `vi.spyOn(window.location, 'assign')` throws `Cannot redefine property` — the same wall spa-home
 * hit and answered with its `LEAVE_APP` token. Reading the globals directly would leave the passkey
 * ceremony, the insecure-context notice and the post-login navigation as the three things this
 * repository could never assert, which is exactly the set worth asserting.
 *
 * Module mocks would work too, once. They stop working the moment the suite runs in a different
 * order, because vitest's registry is shared across files and a module mock is process-wide state —
 * a bill this platform has already paid elsewhere. A token is per-`TestBed`, so a spec that
 * overrides it cannot reach a spec that does not.
 *
 * **Why one token and not three.** They are one fact: what this browsing context can do. A page
 * that has `credentials` but not a secure context is not a state any browser produces, and a spec
 * that set them apart would be testing an impossible browser.
 */
export interface AuthBrowser {
  /** `navigator.credentials`, or `null` where this context cannot run a ceremony at all. */
  readonly credentials: CredentialsContainer | null;
  /** `window.isSecureContext` — false on the raw-IP route, where passkeys do not exist. */
  readonly secureContext: boolean;
  /** A full navigation, not a router hop: the destination is another SPA behind the edge. */
  assign(url: string): void;
}

/** The real browser, or a context that can do nothing when there is no window to ask. */
export const AUTH_BROWSER = new InjectionToken<AuthBrowser>('qits.auth-browser', {
  providedIn: 'root',
  factory: () => {
    const view = inject(DOCUMENT).defaultView;
    return {
      credentials: view?.PublicKeyCredential ? (view.navigator.credentials ?? null) : null,
      secureContext: view?.isSecureContext === true,
      assign: (url: string) => view?.location.assign(url),
    };
  },
});
