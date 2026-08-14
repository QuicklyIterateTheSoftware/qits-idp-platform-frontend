import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * The shell, and deliberately nothing else. The chrome the admin pages are seen through — the
 * sidebar, the top bar, the links out to the other SPAs — is `QitsMainLayout` behind the `''`
 * route, so the one thing this component owns is the outlet that lets the route table render at
 * all.
 *
 * Keeping it empty is what lets the layout survive navigation, and here it is load-bearing for a
 * second reason the sibling explorers do not have: `/idp/login` and `/idp/register` render *no*
 * chrome. Markup put in this template would sit above the routing, where no route could take it
 * away — and it would appear on the sign-in page, which is the one page on this platform that must
 * show nothing but itself.
 *
 * Nor does this app offer the chrome a sub-menu the way spa-mirror does. Its two doors that live
 * inside the layout are administrative, and the auth pages must not be listed beside them; when a
 * sub-menu earns its place it belongs here, in the shell, not in a page.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
export class App {}
