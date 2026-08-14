import { InjectionToken } from '@angular/core';

/**
 * The origin every request in this app is built on, and it is empty on purpose.
 *
 * The SPA is served at `/idp/` by qits-platform-idp itself, behind the same edge that serves
 * `/idp/api/…` — so a same-origin absolute path is not a shortcut, it is the whole reason the
 * browser's cookies reach the service. That matters more here than in any sibling explorer: the
 * WebAuthn ceremony spans two calls and the challenge is carried between them in a
 * `_quarkus_webauthn_challenge` cookie the page never sees. A configured base URL would move these
 * calls cross-origin, and the ceremony would fail on the second request with nothing on screen to
 * explain it.
 *
 * It is a token rather than a constant for one reason: a spec needs a seam to assert the path
 * against. That is the shape every sibling SPA uses, and it adds no behaviour, only a handle.
 */
export const QITS_API_BASE = new InjectionToken<string>('qits.api-base', {
  providedIn: 'root',
  factory: () => '',
});
