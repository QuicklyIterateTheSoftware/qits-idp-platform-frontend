import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { QitsNavSubmenu } from '@qits/ui-components';
import { ViewNav } from './nav/view-nav';

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
 * **The sub-menu is here now, and the reason it was not before is the reason it is.** Its earlier
 * absence was argued from the auth pages: they must not be listed beside the administrative doors.
 * They still are not — they render outside `QitsMainLayout` and the sub-menu only renders inside it
 * — and the administrative doors grew a third, `devices`, which is where a person ends a session
 * they no longer trust. That is not a page to reach by typing a URL. It is declared in the shell
 * and not in a page for the correctness reason `QitsNavSubmenu` documents: `RouterOutlet` destroys
 * the outgoing component after creating the incoming one, so a declaration inside a page is torn
 * down and rebuilt on every hop, in a menu that did not itself change.
 */
@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, QitsNavSubmenu, ViewNav],
  template: `
    <ng-template qitsNavSubmenu><app-view-nav /></ng-template>
    <router-outlet />
  `,
})
export class App {}
