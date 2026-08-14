import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A URL under `/idp/` that this app does not recognise.
 *
 * It renders a small page and stops there. It deliberately does **not** copy spa-home's behaviour
 * of handing the URL back to the gateway: that is the landing page's job, and it is correct only
 * because spa-home is mounted at the root, where an unknown first segment is another micro
 * frontend. Here the segment is already ours, so there is nobody to hand it to.
 *
 * One caveat for whoever lands here from a client library's address: this service's **protocol**
 * surface sits under `/idp/` too, beside these pages rather than under an `/api` of its own —
 * `/idp/token`, `/idp/jwks`, `/idp/.well-known/openid-configuration`. Those are answered by the
 * service and never reach this application, so a machine address mistyped by one character shows
 * up here as an ordinary missing page.
 */
@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <h1>No such page here</h1>
    <p>
      This is the identity provider. It has a sign-in page, a registration page, a list of clients
      and a list of users — and nothing else.
    </p>
    <p><a routerLink="/clients">Back to the clients</a></p>
  `,
  styles: `
    h1 {
      font-size: 1.25rem;
      margin: 0 0 0.5rem;
    }
  `,
})
export class NotFound {}
