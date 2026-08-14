/**
 * Where to send a person once they are signed in — and the one place that decides a caller does not
 * get to choose freely.
 *
 * **The edge appends `?redirect=<path>` when it turns an anonymous navigation away**, so the login
 * page can put the visitor back where they were aiming. That parameter arrives in a URL, which
 * means it arrives from whoever wrote the URL: a mail, a chat message, a page on another site. An
 * open redirect on a sign-in page is the classic phishing lever — the victim really does sign in
 * to the real platform, and the attacker's page is what they land on afterwards, still looking
 * like it belongs.
 *
 * So the rule is an allow-list of one shape, not a block-list of known-bad ones: **a single leading
 * slash, and nothing else that a browser could read as a host.** `/idp/clients` passes.
 * `//evil.example` does not, because a protocol-relative URL is an absolute one wearing a path's
 * clothes. `https://evil.example` does not. `/\evil.example` does not either — browsers normalise
 * the backslash to a slash, so it is `//` with a disguise. Anything at all that fails a check
 * becomes `/`, which is always safe and is where a visitor with no destination was going anyway.
 *
 * Control characters are refused rather than stripped. A newline or a tab inside a redirect target
 * is never a real path from the edge, it is somebody probing what this function normalises, and
 * refusing is both simpler to reason about and simpler to test than sanitising.
 */

/** The default landing place: the platform's own front door. */
export const DEFAULT_REDIRECT = '/';

/** A same-origin path, or `/` when the argument is not plainly one. */
export function safeRedirect(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_REDIRECT;
  if (!raw.startsWith('/')) return DEFAULT_REDIRECT;
  if (raw.startsWith('//') || raw.startsWith('/\\')) return DEFAULT_REDIRECT;
  if ([...raw].some((character) => character.charCodeAt(0) <= 0x20)) return DEFAULT_REDIRECT;
  return raw;
}
