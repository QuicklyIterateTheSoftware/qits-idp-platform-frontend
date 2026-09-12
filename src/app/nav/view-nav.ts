import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * This application's administrative doors, offered to the platform chrome as a sub-menu.
 *
 * **The sub-menu earns its place with the devices page, and not before.** `clients` and `users` were
 * reachable by URL alone and that was defensible while both were empty states nobody was sent to.
 * Signed-in devices is different: it is where a person goes to end a session they no longer trust,
 * which is a thing they will want in a hurry and will not have a URL for. A page nobody can find is
 * not a revocation surface.
 *
 * **The auth pages are deliberately absent.** `login`, `register` and `connect/cli` render outside
 * `QitsMainLayout` entirely, and listing them here would offer a signed-in operator a link to a form
 * that signs them in again.
 *
 * `routerLink`, not `href`: these are routes of this application and a full document load would
 * throw away the running app to arrive in the same place.
 */
@Component({
  selector: 'app-view-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <ul class="views">
      <li>
        <a routerLink="/clients" routerLinkActive="current" ariaCurrentWhenActive="page">Clients</a>
      </li>
      <li>
        <a routerLink="/users" routerLinkActive="current" ariaCurrentWhenActive="page">Users</a>
      </li>
      <li>
        <a routerLink="/devices" routerLinkActive="current" ariaCurrentWhenActive="page"
          >Signed-in devices</a
        >
      </li>
    </ul>
  `,
  styles: `
    .views {
      list-style: none;
      margin: 0;
      padding: 4px 8px 8px 20px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    a {
      display: block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 13px;
      color: #4b5563;
      text-decoration: none;
    }
    a:hover {
      background: #f3f4f6;
      color: #111827;
    }
    .current {
      background: #e5e7eb;
      color: #111827;
      font-weight: 600;
    }
  `,
})
export class ViewNav {}
