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
 * **Why one token and not four.** They are one fact: what this browsing context can do. A page
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
  /**
   * Put text on the clipboard, resolving false when this context has no clipboard to write to.
   *
   * Here for the same reason as the three above: `navigator.clipboard` is absent outside a secure
   * context and absent in jsdom, so the copy button on the CLI code page would be the one control
   * this repository could neither exercise nor explain. It is *not* the page's only way to hand a
   * code over — the code is selectable text — which is why a refusal is a resolved `false` and not
   * a thrown error.
   */
  copy(text: string): Promise<boolean>;
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
      copy: async (text: string) => {
        const clipboard = view?.navigator.clipboard;
        if (!clipboard) return false;
        try {
          await clipboard.writeText(text);
          return true;
        } catch {
          // A denied permission, a document that is not focused, a browser that only allows this
          // inside a user gesture it did not recognise. None of them is worth an error message:
          // the code is on the page and can be selected.
          return false;
        }
      },
    };
  },
});
