import { HttpErrorResponse } from '@angular/common/http';

/**
 * What the person is told when it did not work — and, just as much, what they are not told.
 *
 * **A refusal says one thing, whatever the reason.** The server answers `invalid_request` and
 * `invalid_credentials` separately because a server has to, but the page must not repeat the
 * distinction: "no such user" and "wrong key" told apart is a username oracle, and a token that is
 * merely spent told apart from one that never existed is a token oracle. One sentence covers every
 * refusal, so there is nothing to read off the difference.
 *
 * **The server's body never reaches the screen.** Not the error code, not a stack, not a message —
 * an identity provider's internals are the last thing that belongs on its most public page, and a
 * `{{ message }}` interpolation is how they get there. This is the one place in the app that reads
 * an error, and it reads only the *class* of it.
 *
 * Two exceptions earn themselves, and both are about what the reader should do next rather than
 * about what went wrong:
 *
 * - **The ceremony was dismissed.** `NotAllowedError` is what the browser raises when the passkey
 *   prompt is cancelled or simply runs out of time, and it is by far the most common way this fails.
 *   "Try again" is right and "check your credentials" is wrong, so it is worth telling apart.
 * - **Nothing was reachable.** Status 0 is no answer at all — idp mid-deploy, the tab offline. A
 *   person retyping a correct password because the page implied it was wrong is a bad afternoon.
 *
 * Neither leaks anything: both are facts about this browser, observable without the server.
 */

/** `NotAllowedError` and friends, read structurally — jsdom's `DOMException` is not the browser's. */
function nameOf(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  const named = error as { name?: unknown };
  return typeof named.name === 'string' ? named.name : '';
}

/**
 * A sentence to put on screen. `refusal` is what a genuine "no" says on this page — the caller
 * supplies it because a registration and a sign-in refuse for different reasons and the reader is
 * doing different things.
 */
export function authFailure(error: unknown, refusal: string): string {
  const name = nameOf(error);

  if (name === 'NotAllowedError') {
    return 'The passkey prompt was dismissed, or it timed out. Try again.';
  }
  if (name === 'InvalidStateError') {
    return 'This device already holds a passkey for that account. Sign in with it instead.';
  }
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'The identity provider could not be reached. Try again in a moment.';
  }
  return refusal;
}
